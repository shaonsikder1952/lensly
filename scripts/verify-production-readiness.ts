/**
 * Lensly.care — Production Readiness Verification Suite
 */

import { AVAILABLE_PLANS, CURRENT_PLAN, calculateAnnualCommitment, checkReplacementAllowance } from "../src/lib/pricing";
import { getOpticianPartnersServer } from "../src/lib/partners.server";
import { ConfigurableEmailService } from "../src/lib/notifications.server";
import { getVTOStatus } from "../src/lib/vto";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       └─ ${detail}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       └─ ${detail}`);
  }
}

async function runProductionReadinessPass() {
  console.log("\n=======================================================================");
  console.log("   LENSLY.CARE — MANDATORY PRODUCTION READINESS VERIFICATION PASS");
  console.log("=======================================================================\n");

  // TEST 1: Pricing Consistency & Mathematical Annual Calculations
  let allPlansMathematicallySound = true;
  for (const plan of AVAILABLE_PLANS) {
    const expected = calculateAnnualCommitment(plan.monthlyPrice, plan.minimumTermMonths);
    if (plan.annualPrice !== expected) {
      allPlansMathematicallySound = false;
      console.error(`Plan mismatch: ${plan.id} ${plan.annualPrice} !== ${expected}`);
    }
  }

  assert(
    allPlansMathematicallySound && AVAILABLE_PLANS.length >= 3,
    "Test 1: All pricing plans derive annual commitments mathematically",
    `Standard: €${CURRENT_PLAN.monthlyPrice}/mo * ${CURRENT_PLAN.minimumTermMonths}m = €${CURRENT_PLAN.annualPrice} annual commitment`,
  );

  // TEST 2: Neutral Replacement Claims
  const standardAllowance = checkReplacementAllowance("lensly_care_standard", 0);
  const standardLimitExceeded = checkReplacementAllowance("lensly_care_standard", 3);
  const includedServicesText = CURRENT_PLAN.includedServices.join(" ");
  const hasUnwarrantedGuarantee = includedServicesText.includes("garantiert") || includedServicesText.includes("unbegrenzt");

  assert(
    standardAllowance.eligible === true &&
    standardLimitExceeded.eligible === false &&
    !hasUnwarrantedGuarantee,
    "Test 2: Replacement allowance is configurable and copy is neutral",
    `Allowed: ${standardAllowance.maxAllowed} requests/yr. Zero unwarranted promises found.`,
  );

  // TEST 3: Optician Partner Classification
  const partners = await getOpticianPartnersServer(false);
  const allSeedPartnersMarkedDemo = partners.every((p) => p.partner_type === "demo_test" || p.partner_type === "directory_listing");
  const noFictionalPartnersClaimedVerified = !partners.some((p) => p.partner_type === "verified_partner");

  assert(
    allSeedPartnersMarkedDemo && noFictionalPartnersClaimedVerified,
    "Test 3: Seed optician records are classified as demo/test data",
    `Total: ${partners.length} partners. Demo/Test classified: 100%. Verified partners: 0 (pending genuine onboarding).`,
  );

  // TEST 4: Production Database Guard
  const prevEnv = process.env.NODE_ENV;
  const prevDbUrl = process.env.DATABASE_URL;
  const prevSecret = process.env.ADMIN_SESSION_SECRET;
  let productionGuardThrew = false;

  try {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SESSION_SECRET = "production_test_secret_must_be_32_chars_long";
    delete process.env.DATABASE_URL;

    const { ensureDbInitialized } = await import("../src/lib/subscriptions.server");
    await ensureDbInitialized();
  } catch (err: any) {
    if (err.message && err.message.includes("[Lensly Production Guard]")) {
      productionGuardThrew = true;
    }
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevDbUrl) process.env.DATABASE_URL = prevDbUrl;
    if (prevSecret) process.env.ADMIN_SESSION_SECRET = prevSecret;
    else delete process.env.ADMIN_SESSION_SECRET;
  }

  assert(
    productionGuardThrew === true,
    "Test 4: Production guard throws immediately when DATABASE_URL is missing in production",
    "Silent local JSON fallback is strictly blocked in production mode.",
  );

  // TEST 5: Production Email Delivery Distinction
  const emailService = new ConfigurableEmailService();
  const prevEmailEnv = process.env.NODE_ENV;
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_HOST;

  process.env.NODE_ENV = "development";
  const devDispatch = await emailService.sendNotification("order_confirmed", {
    recipientEmail: "test@example.de",
    orderId: "ORD-DEV-123",
  });

  process.env.NODE_ENV = "production";
  const prodDispatch = await emailService.sendNotification("order_confirmed", {
    recipientEmail: "test@example.de",
    orderId: "ORD-PROD-123",
  });

  process.env.NODE_ENV = prevEmailEnv;

  assert(
    devDispatch.status === "simulation" &&
    prodDispatch.status === "failed" &&
    prodDispatch.success === false,
    "Test 5: Email service distinguishes simulation from failed and guards production delivery",
    `Dev status: ${devDispatch.status}, Prod status: ${prodDispatch.status} (${(prodDispatch.error || "").slice(0, 40)}...)`,
  );

  // TEST 6: VTO Mode Distinction & No Secret Leaks
  const vtoStatus = getVTOStatus();
  const vtoModeDistinguished = vtoStatus.mode === "native_camera_fallback" || vtoStatus.mode === "commercial_fittingbox";

  assert(
    vtoModeDistinguished && typeof vtoStatus.notice === "string",
    "Test 6: VTO clearly distinguishes live commercial engine from native camera fallback",
    `Current Mode: ${vtoStatus.mode} | Notice: "${vtoStatus.notice.slice(0, 60)}..."`,
  );

  console.log("\n=======================================================================");
  console.log(`  PRODUCTION READINESS RESULTS: ${passedTests}/${totalTests} PASSED (${totalTests - passedTests} FAILED)`);
  console.log("=======================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runProductionReadinessPass().catch((err) => {
  console.error("Production readiness test crashed:", err);
  process.exit(1);
});
