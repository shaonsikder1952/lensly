import {
  getCookie,
  setCookie,
  deleteCookie,
  setResponseStatus,
  getRequestHeader,
  getRequestIP,
} from "@tanstack/react-start/server";
import crypto from "node:crypto";
import { recordAuditLogServer } from "./subscriptions.server";
import { verifyAdminPassword, getAllowedOrigins, getAdminUsername } from "./config.server";
import {
  getSessionStore,
  hashSessionToken,
  type SessionRecord,
} from "./session.server";
import { getRateLimitStore, type RateLimitResult } from "./ratelimit.server";

export type AdminSession = SessionRecord;

// --- Rate Limiting Delegation to RateLimitStore ---

export type RateLimitCategory =
  | "login_ip"
  | "login_account"
  | "tracking"
  | "submission"
  | "customer_auth"
  | "customer_api"
  | "messaging"
  | string;

export async function checkAndRecordRateLimit(
  type: RateLimitCategory,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const store = getRateLimitStore();
  const namespacedKey = `${type}:${key}`;
  return await store.checkAndRecord(namespacedKey, limit, windowMs);
}

export async function clearLoginRateLimits(ip: string, accountId: string): Promise<void> {
  const store = getRateLimitStore();
  await store.clear(`login_ip:ip:${ip}`);
  await store.clear(`login_account:id:${accountId}`);
}

export function getClientIdentifier(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) || "unknown";
  } catch {
    return "unknown";
  }
}

export const SESSION_COOKIE_NAME = "admin_session";
export const CSRF_COOKIE_NAME = "lensly_csrf";

export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-admin_session" : SESSION_COOKIE_NAME;
}

export function serializeSessionCookie(sessionId: string, isProd: boolean = false): string {
  const name = isProd ? "__Host-admin_session" : SESSION_COOKIE_NAME;
  const secure = isProd ? "; Secure" : "";
  return `${name}=${sessionId}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=14400`;
}

export function serializeCsrfCookie(csrfToken: string, isProd: boolean = false): string {
  const secure = isProd ? "; Secure" : "";
  return `${CSRF_COOKIE_NAME}=${csrfToken}; Path=/; SameSite=Strict${secure}; Max-Age=14400`;
}

function safeSetStatus(status: number, message?: string) {
  try {
    setResponseStatus(status, message);
  } catch {
    // Suppress outside of active request handler context
  }
}

/**
 * Server-side admin session authentication, trusted-origin verification, and CSRF protection.
 * Sessions are verified against the secure SHA-256 hash of the session token.
 */
export async function requireAdminSession(
  requireCsrf: boolean = false,
  payloadCsrfToken?: string,
  cookieHeaderOverride?: string,
  originHeaderOverride?: string,
  refererHeaderOverride?: string,
): Promise<AdminSession> {
  const cookieName = getSessionCookieName();
  let rawSessionId: string | undefined;

  if (cookieHeaderOverride !== undefined) {
    const cookies = Object.fromEntries(
      cookieHeaderOverride
        .split(";")
        .map((c) => c.trim().split("="))
        .filter((parts) => parts.length >= 2)
        .map(([k, ...v]) => [k, v.join("=")])
    );
    rawSessionId = cookies[cookieName] || cookies["admin_session"] || cookies["__Host-admin_session"];
  } else {
    try {
      rawSessionId = getCookie(cookieName);
    } catch {
      // Outside active request context or cookie missing
    }
  }

  if (!rawSessionId || rawSessionId.trim().length === 0) {
    safeSetStatus(401, "Unauthorized");
    throw new Error("Unauthorized: Admin authentication session required.");
  }

  // Lookup session by SHA-256 hash
  const tokenHash = hashSessionToken(rawSessionId.trim());
  const sessionStore = getSessionStore();
  const session = await sessionStore.get(tokenHash);

  if (!session) {
    safeSetStatus(401, "Unauthorized");
    throw new Error("Unauthorized: Invalid session.");
  }

  if (session.revoked_at) {
    safeSetStatus(401, "Unauthorized");
    throw new Error("Unauthorized: Session has been revoked.");
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    safeSetStatus(401, "Unauthorized");
    throw new Error("Unauthorized: Session expired.");
  }

  // Multi-layered CSRF and Origin protection for state-changing calls
  if (requireCsrf) {
    const trustedOrigins = getAllowedOrigins();

    let origin = originHeaderOverride;
    let referer = refererHeaderOverride;
    if (origin === undefined) {
      try {
        origin = getRequestHeader("origin");
      } catch {}
    }
    if (referer === undefined) {
      try {
        referer = getRequestHeader("referer");
      } catch {}
    }

    // Origin/Referer check against configured APP_ORIGIN / trusted origins
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const normalizedOrigin = `${originUrl.protocol}//${originUrl.host}`;
        if (!trustedOrigins.includes(normalizedOrigin)) {
          safeSetStatus(403, "Forbidden");
          throw new Error(
            `Forbidden: Untrusted Origin "${normalizedOrigin}". State-changing request rejected.`,
          );
        }
      } catch (err: any) {
        if (err.message?.includes("Forbidden")) throw err;
        safeSetStatus(403, "Forbidden");
        throw new Error("Forbidden: Invalid Origin header.");
      }
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        if (!trustedOrigins.includes(refererOrigin)) {
          safeSetStatus(403, "Forbidden");
          throw new Error(
            `Forbidden: Untrusted Referer origin "${refererOrigin}". State-changing request rejected.`,
          );
        }
      } catch (err: any) {
        if (err.message?.includes("Forbidden")) throw err;
        safeSetStatus(403, "Forbidden");
        throw new Error("Forbidden: Invalid Referer header.");
      }
    } else {
      safeSetStatus(403, "Forbidden");
      throw new Error("Forbidden: Missing Origin or Referer header for state-changing request.");
    }

    // Double Submit / CSRF Token check (validates either HTTP header or payload token)
    let clientCsrfToken = payloadCsrfToken;
    if (!clientCsrfToken) {
      try {
        clientCsrfToken = getRequestHeader("x-csrf-token");
      } catch {}
    }

    if (!clientCsrfToken || clientCsrfToken !== session.csrf_token) {
      safeSetStatus(403, "Forbidden");
      throw new Error("Forbidden: CSRF token validation failed.");
    }
  }

  return session;
}

export async function processAdminLogin(password: string, username?: string): Promise<{
  success: boolean;
  csrfToken?: string;
  error?: string;
}> {
  const clientIp = getClientIdentifier();
  const isProd = process.env.NODE_ENV === "production";

  // Check username if supplied
  if (username) {
    const expected = getAdminUsername();
    if (username.trim().toLowerCase() !== expected.toLowerCase()) {
      safeSetStatus(401, "Unauthorized");
      return {
        success: false,
        error: "Invalid username or password.",
      };
    }
  }

  // 1. Dual-Key Rate Limiting (IP + Account) across server instances
  const ipCheck = await checkAndRecordRateLimit("login_ip", `ip:${clientIp}`, 5, 15 * 60 * 1000);
  const accountCheck = await checkAndRecordRateLimit("login_account", "id:admin", 10, 15 * 60 * 1000);

  if (!ipCheck.allowed || !accountCheck.allowed) {
    safeSetStatus(429, "Too Many Requests");
    return {
      success: false,
      error: "Too many failed login attempts. Please try again in 15 minutes.",
    };
  }

  // 2. Timing-safe Argon2id password verification
  const isValid = await verifyAdminPassword(password);
  if (!isValid) {
    await recordAuditLogServer({
      request_id: "AUTH",
      admin_id: username || "unknown",
      action: "ADMIN_LOGIN_FAILURE",
      metadata: `IP_HASH: ${crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16)}`,
    }).catch(() => {});

    safeSetStatus(401, "Unauthorized");
    return {
      success: false,
      error: "Invalid username or password.",
    };
  }

  // 3. Clear rate limits on success
  await clearLoginRateLimits(clientIp, "admin");

  // 4. Issue secure server session & anti-CSRF token
  // Raw session token: 256 bits of cryptographic entropy
  const rawSessionId = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawSessionId);
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

  const sessionStore = getSessionStore();
  await sessionStore.create({
    id: tokenHash, // Store only the secure hash, never raw token
    admin_id: "admin",
    csrf_token: csrfToken,
    ip_hash: crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16),
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  // 5. Set HttpOnly session cookie with __Host- prefix in production
  const cookieName = getSessionCookieName();
  setCookie(cookieName, rawSessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 4 * 60 * 60,
  });

  // 6. Set client-readable SameSite=Strict anti-CSRF cookie
  setCookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 4 * 60 * 60,
  });

  // 7. Audit log (never log raw tokens or passwords)
  await recordAuditLogServer({
    request_id: "AUTH",
    admin_id: "admin",
    action: "ADMIN_LOGIN_SUCCESS",
    metadata: `IP_HASH: ${crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16)}`,
  }).catch(() => {});

  return {
    success: true,
    csrfToken,
  };
}

export async function processAdminLogout(): Promise<{ success: boolean }> {
  const cookieName = getSessionCookieName();
  let rawSessionId: string | undefined;
  try {
    rawSessionId = getCookie(cookieName);
  } catch {}

  if (rawSessionId) {
    const tokenHash = hashSessionToken(rawSessionId.trim());
    const sessionStore = getSessionStore();
    await sessionStore.revoke(tokenHash).catch(() => {});
  }

  const isProd = process.env.NODE_ENV === "production";
  deleteCookie(cookieName, { path: "/", secure: isProd, sameSite: "strict" });
  deleteCookie(CSRF_COOKIE_NAME, { path: "/", secure: isProd, sameSite: "strict" });

  await recordAuditLogServer({
    request_id: "AUTH",
    admin_id: "admin",
    action: "ADMIN_LOGOUT",
  }).catch(() => {});

  return { success: true };
}
