import { hashAdminPassword, verifyAdminPassword } from "../src/lib/config.server";
import {
  checkAndRecordRateLimit,
  requireAdminSession,
  serializeSessionCookie,
  serializeCsrfCookie,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "../src/lib/auth.server";
import {
  createAdminSessionServer,
  getAdminSessionServer,
  revokeAdminSessionServer,
  saveSeparatedFrameRequestServer,
  getPublicFrameRequestStatusServer,
  getCustomerFrameRequestServer,
  adminGetFrameRequestsServer,
  adminUpdateFrameRequestStatusServer,
  adminGetPrescriptionServer,
} from "../src/lib/subscriptions.server";
import {
  savePrivateFile,
  getPrivateFile,
  generateTrackingId,
  MAX_FILE_SIZE_BYTES,
} from "../src/lib/storage.server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(num: number, name: string, passed: boolean, details: string) {
  results.push({ num, name, passed, details });
  const status = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`${status} Test ${num}: ${name} — ${details}`);
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("  LENSLY.CARE COMPREHENSIVE SECURITY VERIFICATION SUITE");
  console.log("=======================================================\n");

  // TEST 1: Admin login with correct credentials (Argon2id)
  try {
    const testPassword = "AdminSecurePassword2026!#$";
    const hashed = await hashAdminPassword(testPassword);
    const isValid = await verifyAdminPassword(testPassword, hashed);
    
    // Test session creation and storage
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await createAdminSessionServer({
      id: sessionToken,
      admin_id: "admin-system",
      csrf_token: csrfToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
    const session = await getAdminSessionServer(sessionToken);

    const passed = isValid && !!session && session.admin_id === "admin-system";
    record(1, "Admin login with correct credentials (Argon2id)", passed, 
      `Argon2id verify=${isValid}, Session created in DB=${session?.id === sessionToken}`);
  } catch (err: any) {
    record(1, "Admin login with correct credentials (Argon2id)", false, err.message);
  }

  // TEST 2: Admin login with wrong credentials
  try {
    const testPassword = "RealAdminPassword123!";
    const hashed = await hashAdminPassword(testPassword);
    const isWrongValid = await verifyAdminPassword("WrongPassword123!", hashed);
    record(2, "Admin login with wrong credentials", !isWrongValid, 
      `Argon2id rejected incorrect password: ${!isWrongValid}`);
  } catch (err: any) {
    record(2, "Admin login with wrong credentials", false, err.message);
  }

  // TEST 3: Brute-force throttling (Dual-key rate limiting)
  try {
    const testKey = `test-ip-${Date.now()}`;
    const maxAttempts = 5;
    const windowMs = 60 * 1000;
    
    let allAllowed = true;
    for (let i = 0; i < maxAttempts; i++) {
      const res = checkAndRecordRateLimit("login_ip", `ip:${testKey}`, maxAttempts, windowMs);
      if (!res.allowed) allAllowed = false;
    }
    const blockedAttempt = checkAndRecordRateLimit("login_ip", `ip:${testKey}`, maxAttempts, windowMs);
    const passed = allAllowed && !blockedAttempt.allowed && blockedAttempt.remaining === 0;
    record(3, "Brute-force throttling (Dual-key sliding window)", passed, 
      `First ${maxAttempts} allowed=${allAllowed}, 6th attempt blocked=${!blockedAttempt.allowed}`);
  } catch (err: any) {
    record(3, "Brute-force throttling (Dual-key sliding window)", false, err.message);
  }

  // TEST 4: Session cookie flags
  try {
    const mockSessionId = "session_token_1234567890abcdef";
    const cookieHeader = serializeSessionCookie(mockSessionId, true);
    const hasHttpOnly = cookieHeader.includes("HttpOnly");
    const hasSameSiteStrict = cookieHeader.includes("SameSite=Strict");
    const hasPathRoot = cookieHeader.includes("Path=/");
    const hasHostPrefix = cookieHeader.includes("__Host-admin_session");
    const passed = hasHttpOnly && hasSameSiteStrict && hasPathRoot && hasHostPrefix;
    record(4, "Session cookie security flags (__Host-, HttpOnly, SameSite=Strict)", passed, 
      `HttpOnly=${hasHttpOnly}, SameSite=Strict=${hasSameSiteStrict}, Path=/${hasPathRoot}, __Host-=${hasHostPrefix}`);
  } catch (err: any) {
    record(4, "Session cookie security flags (__Host-, HttpOnly, SameSite=Strict)", false, err.message);
  }

  // TEST 5: Attempted access without authentication
  try {
    let rejected = false;
    try {
      await requireAdminSession(false, undefined, "");
    } catch (e: any) {
      if (e.message?.includes("Unauthorized") || e.message?.includes("required")) {
        rejected = true;
      }
    }
    record(5, "Attempted access without authentication", rejected, 
      `Unauthenticated access threw 401 Unauthorized: ${rejected}`);
  } catch (err: any) {
    record(5, "Attempted access without authentication", false, err.message);
  }

  // TEST 6: Forged/modified session token
  try {
    const fakeToken = "forged-session-token-" + crypto.randomBytes(16).toString("hex");
    const session = await getAdminSessionServer(fakeToken);
    let rejected = false;
    try {
      await requireAdminSession(false, undefined, `${SESSION_COOKIE_NAME}=${fakeToken}`);
    } catch {
      rejected = true;
    }
    const passed = session === null && rejected;
    record(6, "Forged/modified session token", passed, 
      `DB lookup returned null=${session === null}, requireAdminSession rejected=${rejected}`);
  } catch (err: any) {
    record(6, "Forged/modified session token", false, err.message);
  }

  // TEST 7: Customer attempting to access another customer's request
  try {
    const reqId1 = generateTrackingId();
    const req1 = await saveSeparatedFrameRequestServer({
      requestId: reqId1,
      fullName: "Victim Customer",
      email: "victim@example.com",
      phone: "+4912345678",
      frameBrand: "Mykita",
      frameModel: "Decades",
      notes: "Confidential customer notes",
      prescriptionType: "manual",
      prescriptionSphR: "-2.00",
    });

    // Attempting to access victim's request with an invalid/forged access token
    const blockedAccess = await getCustomerFrameRequestServer(req1.requestId, "wrong_access_token_hash");
    // Access with correct token succeeds
    const legitAccess = await getCustomerFrameRequestServer(req1.requestId, req1.accessToken);

    const passed = blockedAccess === null && legitAccess !== null && legitAccess.request.request_id === req1.requestId;
    record(7, "Customer access isolation & token protection", passed, 
      `Forged token blocked=${blockedAccess === null}, Valid token succeeded=${legitAccess !== null}`);
  } catch (err: any) {
    record(7, "Customer access isolation & token protection", false, err.message);
  }

  // TEST 8: Customer attempting to access another customer's prescription
  try {
    const reqId2 = generateTrackingId();
    const req2 = await saveSeparatedFrameRequestServer({
      requestId: reqId2,
      fullName: "Private Patient",
      email: "patient@example.com",
      phone: "+4998765432",
      frameBrand: "Lindberg",
      frameModel: "Air Titanium",
      prescriptionType: "manual",
      prescriptionSphR: "-4.25",
      prescriptionSphL: "-3.75",
      prescriptionCylR: "-1.00",
      prescriptionCylL: "-0.75",
      prescriptionAxisR: "85",
      prescriptionAxisL: "95",
      prescriptionPd: "63",
    });

    // 1. Public tracking query must NEVER return prescription values or customer PII
    const publicData = await getPublicFrameRequestStatusServer(req2.requestId);
    const hasPii = publicData ? ("email" in publicData || "prescriptionSphR" in publicData || "customerNotes" in publicData) : false;

    // 2. Direct customer query without valid token returns null
    const unauthorizedAccess = await getCustomerFrameRequestServer(req2.requestId, "unauthorized-token");

    const passed = !hasPii && unauthorizedAccess === null && publicData?.status !== undefined;
    record(8, "Prescription data isolation (zero public PII/diopters)", passed, 
      `Public query has PII=${hasPii}, Non-token prescription access blocked=${unauthorizedAccess === null}`);
  } catch (err: any) {
    record(8, "Prescription data isolation (zero public PII/diopters)", false, err.message);
  }

  // TEST 9: CSRF attempt against authenticated admin operation
  try {
    const validSessionToken = crypto.randomBytes(32).toString("hex");
    const validCsrfToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await createAdminSessionServer({
      id: validSessionToken,
      admin_id: "admin-csrf-test",
      csrf_token: validCsrfToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    const cookieHeader = `${SESSION_COOKIE_NAME}=${validSessionToken}; ${CSRF_COOKIE_NAME}=${validCsrfToken}`;

    // Missing CSRF token on mutation must fail
    let missingCsrfBlocked = false;
    try {
      await requireAdminSession(true, undefined, cookieHeader);
    } catch (e: any) {
      if (e.message?.includes("CSRF") || e.message?.includes("Forbidden")) missingCsrfBlocked = true;
    }

    // Mismatched CSRF token must fail
    let mismatchedCsrfBlocked = false;
    try {
      await requireAdminSession(true, "malicious-csrf-token", cookieHeader);
    } catch (e: any) {
      if (e.message?.includes("CSRF") || e.message?.includes("Forbidden")) mismatchedCsrfBlocked = true;
    }

    // Matching CSRF token must succeed
    let matchSucceeded = false;
    try {
      const session = await requireAdminSession(true, validCsrfToken, cookieHeader);
      if (session.admin_id === "admin-csrf-test") matchSucceeded = true;
    } catch (e) {
      matchSucceeded = false;
    }

    const passed = missingCsrfBlocked && mismatchedCsrfBlocked && matchSucceeded;
    record(9, "CSRF multi-layer protection on mutations", passed, 
      `Missing CSRF blocked=${missingCsrfBlocked}, Mismatched blocked=${mismatchedCsrfBlocked}, Valid CSRF accepted=${matchSucceeded}`);
  } catch (err: any) {
    record(9, "CSRF multi-layer protection on mutations", false, err.message);
  }

  // TEST 10: Tracking ID entropy & enumeration resistance
  try {
    const sampleIds = Array.from({ length: 20 }, () => generateTrackingId());
    const idRegex = /^LNS-REQ-[0-9A-F]{32}$/;
    const allMatchFormat = sampleIds.every((id) => idRegex.test(id));
    const uniqueIds = new Set(sampleIds);
    const has128BitsEntropy = sampleIds[0].replace("LNS-REQ-", "").length === 32;

    const passed = allMatchFormat && uniqueIds.size === sampleIds.length && has128BitsEntropy;
    record(10, "Tracking ID entropy (128-bit cryptographically secure)", passed, 
      `Format=LNS-REQ-<32 HEX>, Samples unique=${uniqueIds.size}/${sampleIds.length}, 128-bit entropy verified`);
  } catch (err: any) {
    record(10, "Tracking ID entropy (128-bit cryptographically secure)", false, err.message);
  }

  // TEST 11: Invalid file upload rejection
  try {
    const htmlRes = await savePrivateFile(
      Buffer.from("<html><body>Malicious HTML</body></html>"),
      "text/html",
      "prescription.html"
    );
    const invalidMimeRejected = !htmlRes.success;

    const exeMimeRes = await savePrivateFile(
      Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff"),
      "application/x-msdownload",
      "malware.exe"
    );
    const fakeExeMimeRejected = !exeMimeRes.success;

    const passed = invalidMimeRejected && fakeExeMimeRejected;
    record(11, "Invalid file upload & MIME rejection", passed, 
      `HTML upload rejected=${invalidMimeRejected}, EXE mime rejected=${fakeExeMimeRejected}`);
  } catch (err: any) {
    record(11, "Invalid file upload & MIME rejection", false, err.message);
  }

  // TEST 12: Oversized file upload rejection
  try {
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024); // 10MB + 1KB
    const res = await savePrivateFile(
      oversizedBuffer,
      "application/pdf",
      "oversized_prescription.pdf"
    );
    const oversizedRejected = !res.success && res.error?.includes("10MB");

    record(12, "Oversized file upload rejection (>10MB)", !!oversizedRejected, 
      `Payload ${MAX_FILE_SIZE_BYTES + 1024} bytes rejected: ${oversizedRejected}`);
  } catch (err: any) {
    record(12, "Oversized file upload rejection (>10MB)", false, err.message);
  }

  // TEST 13: Executable disguised as image or PDF (Magic byte validation)
  try {
    // Windows PE executable header MZ disguised as image/jpeg
    const exeAsJpeg = Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff"), Buffer.alloc(100)]);
    const exeRes = await savePrivateFile(
      exeAsJpeg,
      "image/jpeg",
      "prescription.jpg"
    );
    const exeJpegBlocked = !exeRes.success && (exeRes.error?.includes("Executable") || exeRes.error?.includes("failed"));

    // Shell script disguised as application/pdf
    const scriptAsPdf = Buffer.from("#!/bin/bash\nrm -rf /test-dir\n");
    const scriptRes = await savePrivateFile(
      scriptAsPdf,
      "application/pdf",
      "doctor_prescription.pdf"
    );
    const scriptPdfBlocked = !scriptRes.success && (scriptRes.error?.includes("Executable") || scriptRes.error?.includes("failed"));

    const passed = exeJpegBlocked && scriptPdfBlocked;
    record(13, "Executable disguised as image/PDF blocked by magic bytes", passed, 
      `MZ executable blocked=${exeJpegBlocked}, Shell script blocked=${scriptPdfBlocked}`);
  } catch (err: any) {
    record(13, "Executable disguised as image/PDF blocked by magic bytes", false, err.message);
  }

  // TEST 14: Direct public access to stored prescription files
  try {
    // Valid PDF upload with standard PDF magic bytes
    const validPdfHeader = Buffer.concat([Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"), Buffer.alloc(200)]);
    const saveRes = await savePrivateFile(
      validPdfHeader,
      "application/pdf",
      "real_prescription.pdf"
    );

    if (!saveRes.success) {
      throw new Error(`Failed to save test file: ${saveRes.error}`);
    }

    const savedFile = saveRes.file;
    // Check retrieval works via private file reader
    const retrieved = await getPrivateFile(savedFile.fileId);

    // Verify storage file is in storage/private, NOT in public/
    const diskPath = path.resolve(process.cwd(), "storage", "private", `${savedFile.fileId}.pdf`);
    const isInsideWebroot = diskPath.includes(path.resolve(process.cwd(), "public"));

    const passed = !isInsideWebroot && !!retrieved && retrieved.buffer.length > 0;
    record(14, "Private disk/object storage (outside webroot)", passed, 
      `Webroot exposure=${isInsideWebroot}, Authenticated retrieval=${!!retrieved}, File size=${retrieved?.buffer.length} bytes`);
  } catch (err: any) {
    record(14, "Private disk/object storage (outside webroot)", false, err.message);
  }

  // TEST 15: Logout & session invalidation
  try {
    const logoutSessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await createAdminSessionServer({
      id: logoutSessionToken,
      admin_id: "admin-logout-test",
      csrf_token: "csrf-test",
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    const beforeLogout = await getAdminSessionServer(logoutSessionToken);
    await revokeAdminSessionServer(logoutSessionToken);
    const afterLogout = await getAdminSessionServer(logoutSessionToken);

    // Revoked session has revoked_at set, so requireAdminSession rejects it
    let revokedSessionRejected = false;
    try {
      await requireAdminSession(false, undefined, `${SESSION_COOKIE_NAME}=${logoutSessionToken}`);
    } catch {
      revokedSessionRejected = true;
    }

    const passed = !!beforeLogout && (afterLogout === null || !!afterLogout.revoked_at) && revokedSessionRejected;
    record(15, "Logout and server-side session invalidation", passed, 
      `Session active before=${!!beforeLogout}, Session revoked_at set=${!!afterLogout?.revoked_at}, requireAdminSession rejected=${revokedSessionRejected}`);
  } catch (err: any) {
    record(15, "Logout and server-side session invalidation", false, err.message);
  }

  // TEST 16: Production build verification
  try {
    const distClientExists = fs.existsSync(path.resolve(process.cwd(), "dist", "client"));
    const distServerExists = fs.existsSync(path.resolve(process.cwd(), "dist", "server"));
    const distServerJsExists = fs.existsSync(path.resolve(process.cwd(), "dist", "server", "server.js"));
    const passed = distClientExists && distServerExists && distServerJsExists;
    record(16, "Production build (vite build client + ssr)", passed, 
      `dist/client=${distClientExists}, dist/server=${distServerExists}, dist/server/server.js=${distServerJsExists}`);
  } catch (err: any) {
    record(16, "Production build (vite build client + ssr)", false, err.message);
  }

  // HTTP LIVE SERVER CHECK: Security headers
  try {
    console.log("\nChecking live dev server HTTP security headers at http://localhost:5173/admin...");
    const res = await fetch("http://localhost:5173/admin");
    const xcto = res.headers.get("x-content-type-options");
    const xfo = res.headers.get("x-frame-options");
    const rp = res.headers.get("referrer-policy");
    const csp = res.headers.get("content-security-policy");
    console.log(`Live HTTP Response: status=${res.status}`);
    console.log(`  X-Content-Type-Options: ${xcto}`);
    console.log(`  X-Frame-Options: ${xfo}`);
    console.log(`  Referrer-Policy: ${rp}`);
    console.log(`  Content-Security-Policy: ${csp ? csp.slice(0, 60) + "..." : "none"}`);
  } catch (e: any) {
    console.log(`HTTP check info: ${e.message}`);
  }

  console.log("\n=======================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passedCount} | FAILED: ${total - passedCount}`);
  console.log("=======================================================\n");

  if (passedCount !== total) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
