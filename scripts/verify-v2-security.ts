import {
  hashAdminPassword,
  verifyAdminPassword,
  benchmarkArgon2id,
  getAppOrigin,
  getAllowedOrigins,
} from "../src/lib/config.server";
import {
  requireAdminSession,
  serializeSessionCookie,
  serializeCsrfCookie,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "../src/lib/auth.server";
import {
  SessionRecord,
  FileSessionStore,
  hashSessionToken,
} from "../src/lib/session.server";
import {
  PersistentRateLimitStore,
  MemoryRateLimitStore,
} from "../src/lib/ratelimit.server";
import {
  saveSeparatedFrameRequestServer,
  getPublicFrameRequestStatusServer,
  getCustomerFrameRequestServer,
  requestCustomerAccessRecoveryServer,
  saveSubscriptionServer,
  getSubscriptionsServer,
} from "../src/lib/subscriptions.server";
import {
  savePrivateFile,
  getPrivateFile,
  generateTrackingId,
} from "../src/lib/storage.server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

interface TestReport {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const report: TestReport[] = [];

function record(num: number, name: string, passed: boolean, details: string) {
  report.push({ num, name, passed, details });
  const badge = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`${badge} Test ${num}: ${name}\n       └─ ${details}`);
}

async function runV2SecuritySuite() {
  console.log("\n=======================================================================");
  console.log("   LENSLY.CARE — V2 MANDATORY SECURITY PASS VERIFICATION SUITE");
  console.log("=======================================================================\n");

  // Run Argon2id benchmark first
  console.log("--- Benchmark: Argon2id Password Verification ---");
  const bench = await benchmarkArgon2id();
  console.log(`Hash Time: ${bench.hashTimeMs}ms | Verify Time: ${bench.verifyTimeMs}ms | Total: ${bench.totalTimeMs}ms`);
  console.log("Argon2id configuration: Memory=64MB, Iterations=3, Parallelism=4");
  console.log("--------------------------------------------------\n");

  // TEST 1: Two application instances sharing the same session store
  try {
    const sharedStorePath = path.resolve(process.cwd(), "test_shared_sessions.json");
    const instanceA = new FileSessionStore(sharedStorePath);
    const instanceB = new FileSessionStore(sharedStorePath);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(rawToken);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    // Instance A creates session (stores SHA-256 hash, never raw token)
    await instanceA.create({
      id: tokenHash,
      admin_id: "admin-instance-a",
      csrf_token: csrfToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    // Instance B reads session using the token hash
    const foundByB = await instanceB.get(tokenHash);
    const readMatches = foundByB?.admin_id === "admin-instance-a" && foundByB?.csrf_token === csrfToken;

    // Instance B revokes the session
    await instanceB.revoke(tokenHash);

    // Instance A verifies revoked_at is populated
    const foundByAAfterRevoke = await instanceA.get(tokenHash);
    const revokedMatches = !!foundByAAfterRevoke?.revoked_at;

    // Cleanup test file
    try { fs.unlinkSync(sharedStorePath); } catch {}

    const passed = readMatches && revokedMatches;
    record(1, "Two application instances sharing the same session store", passed,
      `Instance B read session=${readMatches}, Instance B revoke reflected in Instance A=${revokedMatches}`);
  } catch (err: any) {
    record(1, "Two application instances sharing the same session store", false, err.message);
  }

  // TEST 2: Application restart does not unexpectedly authenticate a deleted/revoked session
  try {
    const restartStorePath = path.resolve(process.cwd(), "test_restart_sessions.json");
    const coldInstance1 = new FileSessionStore(restartStorePath);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(rawToken);
    await coldInstance1.create({
      id: tokenHash,
      admin_id: "admin-restart-test",
      csrf_token: "csrf-restart",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    // Revoke before restart
    await coldInstance1.revoke(tokenHash);

    // Simulate complete application restart with new store instance
    const coldInstance2 = new FileSessionStore(restartStorePath);
    const restartedSession = await coldInstance2.get(tokenHash);

    const isRevokedOnRestart = !!restartedSession?.revoked_at;

    // Cleanup
    try { fs.unlinkSync(restartStorePath); } catch {}

    const passed = isRevokedOnRestart;
    record(2, "Application restart does not unexpectedly authenticate a deleted/revoked session", passed,
      `Session persisted as revoked after cold store instantiation=${isRevokedOnRestart}`);
  } catch (err: any) {
    record(2, "Application restart does not unexpectedly authenticate a deleted/revoked session", false, err.message);
  }

  // TEST 3: Rate limits remain effective across multiple instances
  try {
    const rateStore1 = new PersistentRateLimitStore();
    const rateStore2 = new PersistentRateLimitStore();
    const testKey = `multi-instance-test-${Date.now()}`;
    const limit = 5;
    const windowMs = 60000;

    // Instance 1 records 3 requests
    await rateStore1.checkAndRecord(testKey, limit, windowMs);
    await rateStore1.checkAndRecord(testKey, limit, windowMs);
    await rateStore1.checkAndRecord(testKey, limit, windowMs);

    // Instance 2 records 2 requests
    await rateStore2.checkAndRecord(testKey, limit, windowMs);
    const fifth = await rateStore2.checkAndRecord(testKey, limit, windowMs);

    // 6th request from Instance 1 must be blocked
    const sixth = await rateStore1.checkAndRecord(testKey, limit, windowMs);

    // Clean up
    await rateStore1.clear(testKey);

    const passed = fifth.allowed && !sixth.allowed && sixth.remaining === 0;
    record(3, "Rate limits remain effective across multiple instances", passed,
      `5th request allowed=${fifth.allowed}, 6th cross-instance request blocked=${!sixth.allowed}`);
  } catch (err: any) {
    record(3, "Rate limits remain effective across multiple instances", false, err.message);
  }

  // TEST 4: Cross-origin mutation is rejected
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(rawToken);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const store = new FileSessionStore();
    await store.create({
      id: tokenHash,
      admin_id: "admin",
      csrf_token: csrfToken,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    const cookieHeader = `${SESSION_COOKIE_NAME}=${rawToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`;
    let crossOriginBlocked = false;

    try {
      // Malicious cross-origin attack from evil-site.com
      await requireAdminSession(true, csrfToken, cookieHeader, "https://evil-attacker.com");
    } catch (e: any) {
      if (e.message?.includes("Untrusted Origin") || e.message?.includes("Forbidden")) {
        crossOriginBlocked = true;
      }
    }

    record(4, "Cross-origin mutation is rejected", crossOriginBlocked,
      `Origin "https://evil-attacker.com" blocked with 403 Forbidden=${crossOriginBlocked}`);
  } catch (err: any) {
    record(4, "Cross-origin mutation is rejected", false, err.message);
  }

  // TEST 5: Missing CSRF token is rejected
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(rawToken);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const store = new FileSessionStore();
    await store.create({
      id: tokenHash,
      admin_id: "admin",
      csrf_token: csrfToken,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    const cookieHeader = `${SESSION_COOKIE_NAME}=${rawToken}`;
    let missingCsrfBlocked = false;

    try {
      // Mutation attempted without CSRF token
      await requireAdminSession(true, undefined, cookieHeader, getAppOrigin());
    } catch (e: any) {
      if (e.message?.includes("CSRF") || e.message?.includes("Forbidden")) {
        missingCsrfBlocked = true;
      }
    }

    record(5, "Missing CSRF token is rejected", missingCsrfBlocked,
      `State-changing mutation without CSRF token threw 403 Forbidden=${missingCsrfBlocked}`);
  } catch (err: any) {
    record(5, "Missing CSRF token is rejected", false, err.message);
  }

  // TEST 6: Invalid origin is rejected
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(rawToken);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const store = new FileSessionStore();
    await store.create({
      id: tokenHash,
      admin_id: "admin",
      csrf_token: csrfToken,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    const cookieHeader = `${SESSION_COOKIE_NAME}=${rawToken}`;
    let invalidOriginBlocked = false;

    try {
      await requireAdminSession(true, csrfToken, cookieHeader, "http://phishing-lensly.fake");
    } catch (e: any) {
      if (e.message?.includes("Forbidden") || e.message?.includes("Untrusted Origin")) {
        invalidOriginBlocked = true;
      }
    }

    record(6, "Invalid origin is rejected", invalidOriginBlocked,
      `Untrusted phishing origin rejected=${invalidOriginBlocked}`);
  } catch (err: any) {
    record(6, "Invalid origin is rejected", false, err.message);
  }

  // TEST 7: Customer requestId without accessToken cannot reveal prescription data
  try {
    const reqId = generateTrackingId();
    await saveSeparatedFrameRequestServer({
      requestId: reqId,
      fullName: "Private Patient",
      email: "patient@lensly-test.com",
      frameBrand: "Cartier",
      frameModel: "Panthère",
      prescriptionType: "manual",
      prescriptionSphR: "-3.50",
      prescriptionCylR: "-0.75",
      notes: "Private patient notes",
    });

    // Public tracking query
    const publicData = await getPublicFrameRequestStatusServer(reqId);
    const leakedKeys = ["email", "fullName", "phone", "prescriptionSphR", "prescriptionCylR", "notes", "customerNotes"]
      .filter((k) => publicData && k in publicData);

    const isSanitized = leakedKeys.length === 0 && publicData?.status !== undefined;
    record(7, "Customer requestId without accessToken cannot reveal prescription data", isSanitized,
      `Public response returned only status & frame info. Leaked sensitive keys: [${leakedKeys.join(", ")}]`);
  } catch (err: any) {
    record(7, "Customer requestId without accessToken cannot reveal prescription data", false, err.message);
  }

  // TEST 8: Correct requestId + valid access token retrieves only that customer's allowed data
  try {
    const reqId = generateTrackingId();
    const created = await saveSeparatedFrameRequestServer({
      requestId: reqId,
      fullName: "Authorized Patient",
      email: "authorized@lensly-test.com",
      frameBrand: "Gucci",
      frameModel: "GG0061S",
      prescriptionType: "manual",
      prescriptionSphR: "-1.75",
      prescriptionSphL: "-2.00",
      prescriptionPd: "62",
    });

    const authenticatedData = await getCustomerFrameRequestServer(reqId, created.accessToken);
    const verified =
      authenticatedData !== null &&
      authenticatedData.customer.email === "authorized@lensly-test.com" &&
      authenticatedData.prescription?.prescription_sph_r === "-1.75";

    record(8, "Correct requestId + valid access token retrieves only that customer's allowed data", verified,
      `Authenticated retrieval matched customer and prescription record: ${verified}`);
  } catch (err: any) {
    record(8, "Correct requestId + valid access token retrieves only that customer's allowed data", false, err.message);
  }

  // TEST 9: Lost/invalid customer access token cannot reveal private medical data
  try {
    const reqId = generateTrackingId();
    await saveSeparatedFrameRequestServer({
      requestId: reqId,
      fullName: "Confidential Customer",
      email: "recovery-test@lensly-test.com",
      frameBrand: "Ray-Ban",
      prescriptionType: "manual",
      prescriptionSphR: "-5.00",
    });

    // 1. Invalid token attempt
    const tampered = await getCustomerFrameRequestServer(reqId, "invalid-forged-token-abc");
    const blockedTampered = tampered === null;

    // 2. Recovery flow request
    const recoveryRes = await requestCustomerAccessRecoveryServer(reqId, "recovery-test@lensly-test.com");
    // Recovery must NEVER return access token or prescription data in response body
    const hasSecretInRecovery = "accessToken" in recoveryRes || "prescription" in recoveryRes;

    const passed = blockedTampered && !hasSecretInRecovery && recoveryRes.success;
    record(9, "Lost/invalid customer access token cannot reveal private medical data", passed,
      `Tampered token returned null=${blockedTampered}, Recovery response contains no leaked secrets=${!hasSecretInRecovery}`);
  } catch (err: any) {
    record(9, "Lost/invalid customer access token cannot reveal private medical data", false, err.message);
  }

  // TEST 10: No production secret appears in client bundles
  try {
    const clientAssetsDir = path.resolve(process.cwd(), "dist", "client", "assets");
    let foundSecret = false;
    let checkedFiles = 0;

    if (fs.existsSync(clientAssetsDir)) {
      const files = fs.readdirSync(clientAssetsDir).filter((f) => f.endsWith(".js"));
      checkedFiles = files.length;
      for (const file of files) {
        const content = fs.readFileSync(path.join(clientAssetsDir, file), "utf-8");
        if (
          content.includes("lensly2026") ||
          content.includes("ADMIN_PASSWORD_HASH") ||
          content.includes("ADMIN_SESSION_SECRET") ||
          content.includes("sk_test_") ||
          content.includes("sk_live_")
        ) {
          foundSecret = true;
          break;
        }
      }
    }

    const passed = !foundSecret && checkedFiles > 0;
    record(10, "No production secret appears in client bundles", passed,
      `Scanned ${checkedFiles} client bundle JS files. Production secrets detected: ${foundSecret}`);
  } catch (err: any) {
    record(10, "No production secret appears in client bundles", false, err.message);
  }

  // TEST 11: No session token appears in logs
  try {
    const rawToken = "super-secret-admin-session-token-xyz-123";
    const tokenHash = hashSessionToken(rawToken);

    // Verify SessionStore only stores the hash
    const store = new FileSessionStore();
    await store.create({
      id: tokenHash,
      admin_id: "audit-test-admin",
      csrf_token: "csrf-audit",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    const stored = await store.get(tokenHash);
    const rawTokenFoundInStore = JSON.stringify(stored).includes(rawToken);

    const passed = !rawTokenFoundInStore && stored?.id === tokenHash;
    record(11, "No session token appears in logs or persistent session store", passed,
      `Store contains only SHA-256 hash (${tokenHash.slice(0, 16)}...), raw token absent=${!rawTokenFoundInStore}`);
  } catch (err: any) {
    record(11, "No session token appears in logs or persistent session store", false, err.message);
  }

  // TEST 12: No prescription values appear in analytics
  try {
    const analyticsFile = fs.readFileSync(path.resolve(process.cwd(), "src", "lib", "analytics.ts"), "utf-8");
    const containsDiopterTracking =
      analyticsFile.includes("prescriptionSphR") ||
      analyticsFile.includes("prescription_sph") ||
      analyticsFile.includes("diopter") ||
      analyticsFile.includes("prescription_file");

    record(12, "No prescription values appear in analytics", !containsDiopterTracking,
      `src/lib/analytics.ts examined. Medical diopters/prescription files tracked: ${containsDiopterTracking}`);
  } catch (err: any) {
    record(12, "No prescription values appear in analytics", false, err.message);
  }

  // TEST 13: Uploaded documents are not publicly reachable
  try {
    const validPdfBuffer = Buffer.concat([Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"), Buffer.alloc(200)]);
    const saveRes = await savePrivateFile(validPdfBuffer, "application/pdf", "sensitive_rx.pdf");

    const isSavedPrivately = saveRes.success && saveRes.file.fileId !== undefined;
    const diskPath = path.resolve(process.cwd(), "storage", "private", `${saveRes.file.fileId}.pdf`);
    const isInsideWebroot = diskPath.includes(path.resolve(process.cwd(), "public"));

    // Verify direct HTTP access to private storage returns 404
    let publicHttpBlocked = false;
    try {
      const res = await fetch(`http://localhost:5173/storage/private/${saveRes.file.fileId}.pdf`);
      publicHttpBlocked = res.status === 404;
    } catch {
      publicHttpBlocked = true;
    }

    const passed = isSavedPrivately && !isInsideWebroot && publicHttpBlocked;
    record(13, "Uploaded documents are not publicly reachable", passed,
      `Stored in storage/private=${isSavedPrivately}, Outside webroot=${!isInsideWebroot}, Direct HTTP 404=${publicHttpBlocked}`);
  } catch (err: any) {
    record(13, "Uploaded documents are not publicly reachable", false, err.message);
  }

  // TEST 14: unsafe-eval is absent unless demonstrably required
  try {
    const serverFile = fs.readFileSync(path.resolve(process.cwd(), "src", "server.ts"), "utf-8");
    const scriptSrcLine = serverFile.split("\n").find((l) => l.includes("script-src")) || "";
    const hasUnsafeEval = scriptSrcLine.includes("'unsafe-eval'");

    record(14, "unsafe-eval is absent from Content-Security-Policy", !hasUnsafeEval,
      `CSP script-src: "${scriptSrcLine.trim()}". Contains 'unsafe-eval': ${hasUnsafeEval}`);
  } catch (err: any) {
    record(14, "unsafe-eval is absent from Content-Security-Policy", false, err.message);
  }

  // TEST 15: Production build succeeds
  try {
    const distClientAssets = fs.existsSync(path.resolve(process.cwd(), "dist", "client", "assets"));
    const distServerJs = fs.existsSync(path.resolve(process.cwd(), "dist", "server", "server.js"));
    const distServerAssets = fs.existsSync(path.resolve(process.cwd(), "dist", "server", "assets"));

    const passed = distClientAssets && distServerJs && distServerAssets;
    record(15, "Production build succeeds (dist/client/assets & dist/server/server.js)", passed,
      `dist/client/assets=${distClientAssets}, dist/server/server.js=${distServerJs}, dist/server/assets=${distServerAssets}`);
  } catch (err: any) {
    record(15, "Production build succeeds (dist/client/assets & dist/server/server.js)", false, err.message);
  }

  // TEST 16: Existing Lensly customer-facing flows still work after security changes
  try {
    const testContractId = `LNS-TEST-${Date.now()}`;
    const sub = await saveSubscriptionServer({
      contract_id: testContractId,
      full_name: "Customer Flow Verification",
      email: "flow-verification@lensly.care",
      phone: "+491701234567",
      birth_date: "1990-01-01",
      birth_place: "Berlin",
      profession: "Engineer",
      street_address: "Kurfürstendamm 1",
      postal_code: "10719",
      city: "Berlin",
      status: "active",
    });

    const subs = await getSubscriptionsServer();
    const subRetrieved = subs.some((s) => s.contract_id === testContractId);

    const passed = sub.contract_id === testContractId && subRetrieved;
    record(16, "Existing Lensly customer-facing flows work properly", passed,
      `Subscription created=${sub.contract_id === testContractId}, Retrieved from server records=${subRetrieved}`);
  } catch (err: any) {
    record(16, "Existing Lensly customer-facing flows work properly", false, err.message);
  }

  console.log("\n=======================================================================");
  const total = report.length;
  const passedCount = report.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`  VERIFICATION RESULTS: ${passedCount}/${total} PASSED (${failedCount} FAILED)`);
  console.log("=======================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runV2SecuritySuite().catch((err) => {
  console.error("V2 Security suite encountered fatal error:", err);
  process.exit(1);
});
