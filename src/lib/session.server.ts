import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getSqlClient, ensureDbInitialized } from "./subscriptions.server";
import { getDataFilePath } from "./data-dir.server";

export interface SessionRecord {
  id: string; // SHA-256 hash of the session token
  admin_id: string;
  csrf_token: string;
  ip_hash?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string;
}

export interface SessionStore {
  create(session: SessionRecord): Promise<void>;
  get(tokenHash: string): Promise<SessionRecord | null>;
  revoke(tokenHash: string): Promise<void>;
  delete(tokenHash: string): Promise<void>;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const ADMIN_SESSIONS_FILE_PATH = getDataFilePath("admin_sessions.json");

/**
 * File-based session store for development fallback.
 * Works across server restarts and stores only SHA-256 hashed session identifiers.
 */
export class FileSessionStore implements SessionStore {
  private filePath: string;

  constructor(filePath: string = ADMIN_SESSIONS_FILE_PATH) {
    this.filePath = filePath;
  }

  private async readAll(): Promise<SessionRecord[]> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as SessionRecord[];
    } catch {
      return [];
    }
  }

  private async writeAll(sessions: SessionRecord[]): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(sessions, null, 2), "utf-8");
    } catch (err) {
      console.error(`[FileSessionStore] Failed to write sessions to ${this.filePath}:`, err);
    }
  }

  async create(session: SessionRecord): Promise<void> {
    const list = await this.readAll();
    list.unshift(session);
    await this.writeAll(list);
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    const list = await this.readAll();
    const normalizedHash = tokenHash.trim().toLowerCase();
    const found = list.find((s) => s.id.toLowerCase() === normalizedHash);
    return found || null;
  }

  async revoke(tokenHash: string): Promise<void> {
    const list = await this.readAll();
    const now = new Date().toISOString();
    const normalizedHash = tokenHash.trim().toLowerCase();
    const updated = list.map((s) =>
      s.id.toLowerCase() === normalizedHash ? { ...s, revoked_at: now } : s,
    );
    await this.writeAll(updated);
  }

  async delete(tokenHash: string): Promise<void> {
    const list = await this.readAll();
    const normalizedHash = tokenHash.trim().toLowerCase();
    const filtered = list.filter((s) => s.id.toLowerCase() !== normalizedHash);
    await this.writeAll(filtered);
  }
}

/**
 * PostgreSQL-based session store for production environments.
 * Ensures session durability across multiple application instances and deployment rollouts.
 */
export class PostgresSessionStore implements SessionStore {
  async create(session: SessionRecord): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) {
      throw new Error("PostgreSQL client unavailable for session creation");
    }

    await client`
      INSERT INTO admin_sessions (
        id, admin_id, csrf_token, ip_hash, user_agent, created_at, expires_at, revoked_at
      ) VALUES (
        ${session.id},
        ${session.admin_id},
        ${session.csrf_token},
        ${session.ip_hash ?? null},
        ${session.user_agent ?? null},
        ${session.created_at},
        ${session.expires_at},
        ${session.revoked_at ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        csrf_token = EXCLUDED.csrf_token,
        expires_at = EXCLUDED.expires_at,
        revoked_at = EXCLUDED.revoked_at
    `;
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) return null;

    const rows = await client`
      SELECT id, admin_id, csrf_token, ip_hash, user_agent, created_at, expires_at, revoked_at
      FROM admin_sessions
      WHERE id = ${tokenHash}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;
    return rows[0] as SessionRecord;
  }

  async revoke(tokenHash: string): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) return;

    const now = new Date().toISOString();
    await client`
      UPDATE admin_sessions
      SET revoked_at = ${now}
      WHERE id = ${tokenHash}
    `;
  }

  async delete(tokenHash: string): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) return;

    await client`
      DELETE FROM admin_sessions
      WHERE id = ${tokenHash}
    `;
  }
}

let activeSessionStore: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!activeSessionStore) {
    if (process.env.DATABASE_URL) {
      activeSessionStore = new PostgresSessionStore();
    } else {
      activeSessionStore = new FileSessionStore();
    }
  }
  return activeSessionStore;
}

export function setSessionStore(store: SessionStore): void {
  activeSessionStore = store;
}
