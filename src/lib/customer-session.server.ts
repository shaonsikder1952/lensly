import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
  getRequestIP,
  setResponseStatus,
} from "@tanstack/react-start/server";
import { getSqlClient, ensureDbInitialized } from "./subscriptions.server";
import { getAllowedOrigins } from "./config.server";
import { getDataFilePath } from "./data-dir.server";

export interface CustomerSessionRecord {
  id: string; // SHA-256 hash of the customer session token
  customer_email: string;
  contract_id?: string;
  csrf_token: string;
  ip_hash?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string;
}

export interface CustomerHandoffRecord {
  token_hash: string;
  customer_email: string;
  contract_id?: string;
  expires_at: number; // Unix timestamp in milliseconds
  used: boolean;
}

export function hashCustomerToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

const CUSTOMER_SESSIONS_FILE_PATH = getDataFilePath("customer_sessions.json");
const CUSTOMER_HANDOFFS_FILE_PATH = getDataFilePath("customer_handoffs.json");

// ---------------------------------------------------------------------------
// Store Implementations (PostgreSQL with File Fallback for Development)
// ---------------------------------------------------------------------------

export interface CustomerSessionStore {
  createSession(session: CustomerSessionRecord): Promise<void>;
  getSession(tokenHash: string): Promise<CustomerSessionRecord | null>;
  revokeSession(tokenHash: string): Promise<void>;
  createHandoff(handoff: CustomerHandoffRecord): Promise<void>;
  consumeHandoff(tokenHash: string): Promise<CustomerHandoffRecord | null>;
}

export class FileCustomerSessionStore implements CustomerSessionStore {
  private async readSessions(): Promise<CustomerSessionRecord[]> {
    try {
      const data = await fs.readFile(CUSTOMER_SESSIONS_FILE_PATH, "utf-8");
      return JSON.parse(data) as CustomerSessionRecord[];
    } catch {
      return [];
    }
  }

  private async writeSessions(sessions: CustomerSessionRecord[]): Promise<void> {
    try {
      await fs.writeFile(CUSTOMER_SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 2), "utf-8");
    } catch (err) {
      console.error("[FileCustomerSessionStore] Error writing sessions:", err);
    }
  }

  private async readHandoffs(): Promise<CustomerHandoffRecord[]> {
    try {
      const data = await fs.readFile(CUSTOMER_HANDOFFS_FILE_PATH, "utf-8");
      return JSON.parse(data) as CustomerHandoffRecord[];
    } catch {
      return [];
    }
  }

  private async writeHandoffs(handoffs: CustomerHandoffRecord[]): Promise<void> {
    try {
      await fs.writeFile(CUSTOMER_HANDOFFS_FILE_PATH, JSON.stringify(handoffs, null, 2), "utf-8");
    } catch (err) {
      console.error("[FileCustomerSessionStore] Error writing handoffs:", err);
    }
  }

  async createSession(session: CustomerSessionRecord): Promise<void> {
    const list = await this.readSessions();
    list.unshift(session);
    await this.writeSessions(list);
  }

  async getSession(tokenHash: string): Promise<CustomerSessionRecord | null> {
    const list = await this.readSessions();
    const normalized = tokenHash.trim().toLowerCase();
    const found = list.find((s) => s.id.toLowerCase() === normalized);
    return found || null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const list = await this.readSessions();
    const normalized = tokenHash.trim().toLowerCase();
    const now = new Date().toISOString();
    const updated = list.map((s) =>
      s.id.toLowerCase() === normalized ? { ...s, revoked_at: now } : s,
    );
    await this.writeSessions(updated);
  }

  async createHandoff(handoff: CustomerHandoffRecord): Promise<void> {
    const list = await this.readHandoffs();
    list.unshift(handoff);
    await this.writeHandoffs(list);
  }

  async consumeHandoff(tokenHash: string): Promise<CustomerHandoffRecord | null> {
    const list = await this.readHandoffs();
    const normalized = tokenHash.trim().toLowerCase();
    const handoff = list.find((h) => h.token_hash.toLowerCase() === normalized);
    if (!handoff) return null;

    if (handoff.used || Date.now() > handoff.expires_at) {
      return null;
    }

    handoff.used = true;
    await this.writeHandoffs(list);
    return handoff;
  }
}

export class PostgresCustomerSessionStore implements CustomerSessionStore {
  async createSession(session: CustomerSessionRecord): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) throw new Error("PostgreSQL unavailable for customer session creation");

    await client`
      INSERT INTO customer_sessions (
        id, customer_email, contract_id, csrf_token, ip_hash, user_agent, created_at, expires_at, revoked_at
      ) VALUES (
        ${session.id},
        ${session.customer_email},
        ${session.contract_id ?? null},
        ${session.csrf_token},
        ${session.ip_hash ?? null},
        ${session.user_agent ?? null},
        ${session.created_at},
        ${session.expires_at},
        ${session.revoked_at ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        revoked_at = EXCLUDED.revoked_at
    `;
  }

  async getSession(tokenHash: string): Promise<CustomerSessionRecord | null> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) throw new Error("PostgreSQL unavailable for customer session lookup");

    const rows = await client`
      SELECT * FROM customer_sessions WHERE id = ${tokenHash.trim().toLowerCase()} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      customer_email: r.customer_email,
      contract_id: r.contract_id || undefined,
      csrf_token: r.csrf_token,
      ip_hash: r.ip_hash || undefined,
      user_agent: r.user_agent || undefined,
      created_at: new Date(r.created_at).toISOString(),
      expires_at: new Date(r.expires_at).toISOString(),
      revoked_at: r.revoked_at ? new Date(r.revoked_at).toISOString() : undefined,
    };
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) throw new Error("PostgreSQL unavailable for customer session revocation");

    await client`
      UPDATE customer_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ${tokenHash.trim().toLowerCase()}
    `;
  }

  async createHandoff(handoff: CustomerHandoffRecord): Promise<void> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) throw new Error("PostgreSQL unavailable for customer handoff creation");

    await client`
      INSERT INTO customer_handoffs (
        token_hash, customer_email, contract_id, expires_at, used
      ) VALUES (
        ${handoff.token_hash},
        ${handoff.customer_email},
        ${handoff.contract_id ?? null},
        ${new Date(handoff.expires_at).toISOString()},
        ${handoff.used}
      )
    `;
  }

  async consumeHandoff(tokenHash: string): Promise<CustomerHandoffRecord | null> {
    await ensureDbInitialized();
    const client = getSqlClient();
    if (!client) throw new Error("PostgreSQL unavailable for customer handoff consumption");

    const normalized = tokenHash.trim().toLowerCase();
    const rows = await client`
      SELECT * FROM customer_handoffs 
      WHERE token_hash = ${normalized} AND used = false AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    await client`
      UPDATE customer_handoffs SET used = true WHERE token_hash = ${normalized}
    `;

    const r = rows[0];
    return {
      token_hash: r.token_hash,
      customer_email: r.customer_email,
      contract_id: r.contract_id || undefined,
      expires_at: new Date(r.expires_at).getTime(),
      used: true,
    };
  }
}

let activeCustomerSessionStore: CustomerSessionStore | null = null;

export function getCustomerSessionStore(): CustomerSessionStore {
  if (activeCustomerSessionStore) return activeCustomerSessionStore;
  const isProduction = process.env.NODE_ENV === "production";
  const client = getSqlClient();

  if (isProduction || client) {
    activeCustomerSessionStore = new PostgresCustomerSessionStore();
  } else {
    activeCustomerSessionStore = new FileCustomerSessionStore();
  }
  return activeCustomerSessionStore;
}

// ---------------------------------------------------------------------------
// Cookie & Security Configuration
// ---------------------------------------------------------------------------

export const DEV_CUSTOMER_SESSION_COOKIE = "lensly_customer_session";
export const PROD_CUSTOMER_SESSION_COOKIE = "__Host-customer_session";
export const CUSTOMER_CSRF_COOKIE_NAME = "lensly_customer_csrf";

export function getCustomerSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? PROD_CUSTOMER_SESSION_COOKIE
    : DEV_CUSTOMER_SESSION_COOKIE;
}

export function serializeCustomerSessionCookie(token: string, isProd: boolean = false): string {
  const name = isProd ? PROD_CUSTOMER_SESSION_COOKIE : DEV_CUSTOMER_SESSION_COOKIE;
  const secure = isProd ? "; Secure" : "";
  // 7 days expiration for customer convenience
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=604800`;
}

export function serializeCustomerCsrfCookie(csrfToken: string, isProd: boolean = false): string {
  const secure = isProd ? "; Secure" : "";
  return `${CUSTOMER_CSRF_COOKIE_NAME}=${csrfToken}; Path=/; SameSite=Strict${secure}; Max-Age=604800`;
}

// ---------------------------------------------------------------------------
// Server Handoff Token Generation & Verification
// ---------------------------------------------------------------------------

/**
 * Creates a short-lived (5-minute TTL), single-use handoff code.
 * ONLY called by trusted server functions (e.g. after verifying Stripe session or direct server subscription creation).
 * NEVER called from untrusted client-supplied identity parameters.
 */
export async function createCustomerHandoffServer(
  customerEmail: string,
  contractId?: string,
): Promise<string> {
  const email = customerEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Invalid customer email for handoff generation");
  }

  const rawHandoffToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashCustomerToken(rawHandoffToken);
  const store = getCustomerSessionStore();

  await store.createHandoff({
    token_hash: tokenHash,
    customer_email: email,
    contract_id: contractId?.trim() || undefined,
    expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
    used: false,
  });

  return rawHandoffToken;
}

/**
 * Exchanges a single-use handoff code via POST for an authenticated HttpOnly session cookie.
 * Marks handoff as used immediately (replay protection).
 */
export async function exchangeCustomerHandoffServer(
  rawHandoffToken: string,
  cookieHeaderOverride?: string,
): Promise<{
  success: boolean;
  customerEmail: string;
  contractId?: string;
  csrfToken: string;
  setCookieHeaders?: string[];
}> {
  if (!rawHandoffToken || rawHandoffToken.length < 16) {
    throw new Error("Invalid or missing handoff token");
  }

  const tokenHash = hashCustomerToken(rawHandoffToken);
  const store = getCustomerSessionStore();
  const handoff = await store.consumeHandoff(tokenHash);

  if (!handoff) {
    throw new Error("Forbidden: Handoff token is invalid, expired, or already used.");
  }

  // Create new customer session
  const rawSessionToken = crypto.randomBytes(32).toString("hex");
  const sessionHash = hashCustomerToken(rawSessionToken);
  const csrfToken = crypto.randomBytes(24).toString("hex");

  let ipHash: string | undefined;
  try {
    const ip = getRequestIP({ xForwardedFor: true });
    if (ip) ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  } catch {}

  let userAgent: string | undefined;
  try {
    userAgent = getRequestHeader("user-agent") || undefined;
  } catch {}

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const sessionRecord: CustomerSessionRecord = {
    id: sessionHash,
    customer_email: handoff.customer_email,
    contract_id: handoff.contract_id,
    csrf_token: csrfToken,
    ip_hash: ipHash,
    user_agent: userAgent,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  await store.createSession(sessionRecord);

  // Set secure HttpOnly cookies
  const isProd = process.env.NODE_ENV === "production";
  const sessionCookieName = getCustomerSessionCookieName();

  try {
    setCookie(sessionCookieName, rawSessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    setCookie(CUSTOMER_CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Accessible to client JavaScript to include in mutation headers
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch {
    // Suppress if outside active request context (e.g. unit test runner)
  }

  const setCookieHeaders = [
    serializeCustomerSessionCookie(rawSessionToken, isProd),
    serializeCustomerCsrfCookie(csrfToken, isProd),
  ];

  return {
    success: true,
    customerEmail: handoff.customer_email,
    contractId: handoff.contract_id,
    csrfToken,
    setCookieHeaders,
  };
}

/**
 * Revokes active customer session and clears the session cookie.
 */
export async function customerLogoutServer(cookieHeaderOverride?: string): Promise<boolean> {
  const cookieName = getCustomerSessionCookieName();
  let rawSessionToken: string | undefined;

  if (cookieHeaderOverride !== undefined) {
    const cookies = Object.fromEntries(
      cookieHeaderOverride
        .split(";")
        .map((c) => c.trim().split("="))
        .filter((p) => p.length >= 2)
        .map(([k, ...v]) => [k, v.join("=")]),
    );
    rawSessionToken = cookies[cookieName] || cookies[DEV_CUSTOMER_SESSION_COOKIE] || cookies[PROD_CUSTOMER_SESSION_COOKIE];
  } else {
    try {
      rawSessionToken = getCookie(cookieName);
    } catch {}
  }

  if (rawSessionToken) {
    const tokenHash = hashCustomerToken(rawSessionToken);
    const store = getCustomerSessionStore();
    await store.revokeSession(tokenHash);
  }

  try {
    deleteCookie(cookieName, { path: "/" });
    deleteCookie(CUSTOMER_CSRF_COOKIE_NAME, { path: "/" });
  } catch {}

  return true;
}

/**
 * Server-side customer authorization guard.
 * Strictly derives customer identity from HttpOnly session cookie verified against session store.
 * Validates Origin and CSRF for state-changing operations.
 */
export async function requireCustomerSession(
  requireCsrf: boolean = false,
  payloadCsrfToken?: string,
  cookieHeaderOverride?: string,
  originHeaderOverride?: string,
  refererHeaderOverride?: string,
): Promise<CustomerSessionRecord> {
  const cookieName = getCustomerSessionCookieName();
  let rawSessionToken: string | undefined;

  if (cookieHeaderOverride !== undefined) {
    const cookies = Object.fromEntries(
      cookieHeaderOverride
        .split(";")
        .map((c) => c.trim().split("="))
        .filter((p) => p.length >= 2)
        .map(([k, ...v]) => [k, v.join("=")]),
    );
    rawSessionToken = cookies[cookieName] || cookies[DEV_CUSTOMER_SESSION_COOKIE] || cookies[PROD_CUSTOMER_SESSION_COOKIE];
  } else {
    try {
      rawSessionToken = getCookie(cookieName);
    } catch {}
  }

  if (!rawSessionToken || rawSessionToken.trim().length < 16) {
    try {
      setResponseStatus(401, "Unauthorized");
    } catch {}
    throw new Error("Unauthorized: Customer session required. Please sign in or complete checkout.");
  }

  const tokenHash = hashCustomerToken(rawSessionToken);
  const store = getCustomerSessionStore();
  const session = await store.getSession(tokenHash);

  if (!session) {
    try {
      setResponseStatus(401, "Unauthorized");
    } catch {}
    throw new Error("Unauthorized: Invalid customer session.");
  }

  if (session.revoked_at) {
    try {
      setResponseStatus(401, "Unauthorized");
    } catch {}
    throw new Error("Unauthorized: Customer session has been revoked.");
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    try {
      setResponseStatus(401, "Unauthorized");
    } catch {}
    throw new Error("Unauthorized: Customer session has expired.");
  }

  // Enforce Trusted Origin & CSRF for state-changing requests
  if (requireCsrf) {
    let origin = originHeaderOverride;
    let referer = refererHeaderOverride;

    if (origin === undefined) {
      try {
        origin = getRequestHeader("origin") || undefined;
      } catch {}
    }
    if (referer === undefined) {
      try {
        referer = getRequestHeader("referer") || undefined;
      } catch {}
    }

    const allowedOrigins = getAllowedOrigins();
    const isOriginAllowed = origin && allowedOrigins.includes(origin.replace(/\/+$/, ""));
    const isRefererAllowed =
      referer && allowedOrigins.some((allowed) => referer.startsWith(allowed));

    if (!isOriginAllowed && !isRefererAllowed) {
      try {
        setResponseStatus(403, "Forbidden");
      } catch {}
      throw new Error(`Forbidden: Untrusted request origin. Request origin: ${origin || "missing"}`);
    }

    const csrfCandidate = payloadCsrfToken?.trim();
    if (!csrfCandidate || csrfCandidate !== session.csrf_token) {
      try {
        setResponseStatus(403, "Forbidden");
      } catch {}
      throw new Error("Forbidden: Invalid CSRF token for customer mutation.");
    }
  }

  return session;
}

/**
 * Creates an authenticated customer session directly from a verified customer email.
 * Sets the HttpOnly session cookie and returns session details.
 */
export async function createDirectCustomerSession(
  customerEmail: string,
  contractId?: string,
): Promise<{
  success: boolean;
  customerEmail: string;
  contractId?: string;
  csrfToken: string;
}> {
  const store = getCustomerSessionStore();
  const rawSessionToken = crypto.randomBytes(32).toString("hex");
  const sessionHash = hashCustomerToken(rawSessionToken);
  const csrfToken = crypto.randomBytes(24).toString("hex");

  let ipHash: string | undefined;
  try {
    const ip = getRequestIP({ xForwardedFor: true });
    if (ip) ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  } catch {}

  let userAgent: string | undefined;
  try {
    userAgent = getRequestHeader("user-agent") || undefined;
  } catch {}

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const sessionRecord: CustomerSessionRecord = {
    id: sessionHash,
    customer_email: customerEmail.trim().toLowerCase(),
    contract_id: contractId?.trim() || undefined,
    csrf_token: csrfToken,
    ip_hash: ipHash,
    user_agent: userAgent,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  await store.createSession(sessionRecord);

  const isProd = process.env.NODE_ENV === "production";
  const sessionCookieName = getCustomerSessionCookieName();

  try {
    setCookie(sessionCookieName, rawSessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    setCookie(CUSTOMER_CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch {}

  return {
    success: true,
    customerEmail: sessionRecord.customer_email,
    contractId: sessionRecord.contract_id,
    csrfToken,
  };
}
