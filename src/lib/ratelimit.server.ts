import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getSqlClient, ensureDbInitialized } from "./subscriptions.server";
import { getDataFilePath } from "./data-dir.server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs?: number;
}

export interface RateLimitStore {
  checkAndRecord(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  clear(key: string): Promise<void>;
}

/**
 * In-memory sliding window rate limiter for local development and unit tests.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private records = new Map<string, number[]>();

  async checkAndRecord(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const cutoff = now - windowMs;
    let timestamps = this.records.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > cutoff);

    if (timestamps.length >= limit) {
      this.records.set(key, timestamps);
      const earliest = timestamps[0];
      const resetMs = Math.max(0, earliest + windowMs - now);
      return { allowed: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    this.records.set(key, timestamps);
    return { allowed: true, remaining: limit - timestamps.length };
  }

  async clear(key: string): Promise<void> {
    this.records.delete(key);
  }
}

const RATE_LIMIT_FILE_PATH = getDataFilePath("rate_limits.json");

/**
 * Persistent rate limiter that synchronizes across server processes and application restarts.
 * Uses PostgreSQL in production or atomic file updates in development/fallback mode.
 */
export class PersistentRateLimitStore implements RateLimitStore {
  private inMemoryFallback = new MemoryRateLimitStore();

  async checkAndRecord(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const cutoff = now - windowMs;

    try {
      const isDb = await ensureDbInitialized();
      const client = getSqlClient();

      if (isDb && client) {
        // Ensure rate_limits table exists
        await client`
          CREATE TABLE IF NOT EXISTS rate_limits (
            key VARCHAR(255) PRIMARY KEY,
            attempts JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `;

        const rows = await client`
          SELECT attempts FROM rate_limits WHERE key = ${key} LIMIT 1
        `;

        let attempts: number[] = [];
        if (rows && rows.length > 0 && Array.isArray(rows[0].attempts)) {
          attempts = (rows[0].attempts as number[]).filter((ts) => ts > cutoff);
        }

        if (attempts.length >= limit) {
          const earliest = attempts[0] || now;
          const resetMs = Math.max(0, earliest + windowMs - now);
          return { allowed: false, remaining: 0, resetMs };
        }

        attempts.push(now);
        await client`
          INSERT INTO rate_limits (key, attempts, updated_at)
          VALUES (${key}, ${JSON.stringify(attempts)}, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            attempts = ${JSON.stringify(attempts)},
            updated_at = CURRENT_TIMESTAMP
        `;

        return { allowed: true, remaining: limit - attempts.length };
      }
    } catch (err) {
      console.warn("[PersistentRateLimitStore] Database rate limit sync failed, using file/memory fallback:", err);
    }

    // File-based fallback for multi-process development
    try {
      let data: Record<string, number[]> = {};
      try {
        const raw = await fs.readFile(RATE_LIMIT_FILE_PATH, "utf-8");
        data = JSON.parse(raw);
      } catch {}

      let timestamps = (data[key] || []).filter((ts) => ts > cutoff);
      if (timestamps.length >= limit) {
        const earliest = timestamps[0] || now;
        const resetMs = Math.max(0, earliest + windowMs - now);
        return { allowed: false, remaining: 0, resetMs };
      }

      timestamps.push(now);
      data[key] = timestamps;
      await fs.writeFile(RATE_LIMIT_FILE_PATH, JSON.stringify(data), "utf-8");
      return { allowed: true, remaining: limit - timestamps.length };
    } catch {
      return await this.inMemoryFallback.checkAndRecord(key, limit, windowMs);
    }
  }

  async clear(key: string): Promise<void> {
    try {
      const isDb = await ensureDbInitialized();
      const client = getSqlClient();
      if (isDb && client) {
        await client`DELETE FROM rate_limits WHERE key = ${key}`;
      }
    } catch {}

    try {
      const raw = await fs.readFile(RATE_LIMIT_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      delete data[key];
      await fs.writeFile(RATE_LIMIT_FILE_PATH, JSON.stringify(data), "utf-8");
    } catch {}

    await this.inMemoryFallback.clear(key);
  }
}

let activeRateLimitStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (!activeRateLimitStore) {
    if (process.env.DATABASE_URL) {
      activeRateLimitStore = new PersistentRateLimitStore();
    } else {
      activeRateLimitStore = new MemoryRateLimitStore();
    }
  }
  return activeRateLimitStore;
}

export function setRateLimitStore(store: RateLimitStore): void {
  activeRateLimitStore = store;
}
