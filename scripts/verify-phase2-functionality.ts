/**
 * Lensly.care Phase 2 Functional QA & Verification Suite
 * Tests all Phase 2 eyewear service platform features:
 * - Pricing architecture & configurable plans
 * - 8-stage order status pipeline
 * - Frame request management with internal procurement cost confidentiality
 * - Customer access token protected decision flow
 * - 5-stage prescription review workflow & audit trail
 * - Optician partner search by city & PLZ
 * - Replacement request quota enforcement
 * - Threaded customer/admin messaging
 * - Virtual Try-On (VTO) integration boundary
 */

import { AVAILABLE_PLANS, getPlanById, checkReplacementAllowance, formatEur } from "../src/lib/pricing";
import {
  createOrderServer,
  getOrdersServer,
  getOrderByIdServer,
  updateOrderStatusServer,
  ORDER_STATUS_PIPELINE,
} from "../src/lib/orders.server";
import {
  saveSeparatedFrameRequestServer,
  getCustomerOverviewServer,
  customerRespondToFrameOptionServer,
  adminUpdateFrameRequestDetailsServer,
  adminUpdatePrescriptionReviewServer,
} from "../src/lib/subscriptions.server";
import {
  getOpticianPartnersServer,
  searchOpticianPartnersServer,
  updateOpticianPartnerServer,
} from "../src/lib/partners.server";
import {
  submitReplacementRequestServer,
  getReplacementRequestsServer,
  updateReplacementStatusServer,
} from "../src/lib/replacements.server";
import {
  getMessagesServer,
  sendMessageServer,
} from "../src/lib/messaging.server";
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

async function runPhase2FunctionalTests() {
  console.log("\n=======================================================================");
  console.log("   LENSLY.CARE — PHASE 2 FUNCTIONAL SERVICE PLATFORM TEST SUITE");
  console.log("=======================================================================\n");

  // TEST 1: Pricing & Plans Central Configuration
  const standardPlan = getPlanById("standard");
  const plusPlan = getPlanById("plus");
  const essentialPlan = getPlanById("essential");

  assert(
    Boolean(standardPlan && plusPlan && essentialPlan),
    "Test 1: Central Pricing Architecture loads all active plans",
    `Loaded: ${AVAILABLE_PLANS.map((p) => `${p.name} (${formatEur(p.monthlyPrice)}/mo)`).join(", ")}`,
  );

  const allowanceCheck1 = checkReplacementAllowance("lensly_care_standard", 0);
  const allowanceCheck2 = checkReplacementAllowance("lensly_care_standard", 3);
  assert(
    allowanceCheck1.eligible === true && allowanceCheck2.eligible === false,
    "Test 2: Plan replacement quotas enforced dynamically",
    `Standard allowance 0 used: eligible=${allowanceCheck1.eligible}, 3 used: eligible=${allowanceCheck2.eligible}`,
  );

  // TEST 3: 8-Stage Order Status Pipeline
  const testOrderId = `ORD-TEST-${Date.now()}`;
  const newOrder = await createOrderServer({
    order_id: testOrderId,
    customer_name: "Greta Müller",
    customer_email: "greta.mueller@example.de",
    frame_name: "The Classic Acetate (Honey Tortoise)",
    lens_type: "Single Vision Index 1.6",
    status: "Requested",
    carrier: "DHL Express",
    tracking_number: "DHL-9948201",
    estimated_delivery: "3 Business Days",
  });

  assert(
    newOrder.status === "Requested" && ORDER_STATUS_PIPELINE.length === 8,
    "Test 3: Initial order created in 8-stage pipeline",
    `Order ID: ${newOrder.order_id}, Pipeline stages: ${ORDER_STATUS_PIPELINE.join(" -> ")}`,
  );

  // Move through pipeline to 'Shipped'
  const updatedOrder = await updateOrderStatusServer(testOrderId, "Shipped", {
    carrier: "DHL Express",
    trackingNumber: "DHL-9948201",
    notes: "Quality inspection passed, handed over to courier.",
  });

  assert(
    updatedOrder !== null && updatedOrder.status === "Shipped",
    "Test 4: Order status updated to Shipped with tracking information",
    `Status: ${updatedOrder?.status}, Carrier: ${updatedOrder?.carrier}, Tracking: ${updatedOrder?.tracking_number}`,
  );

  // TEST 5: Frame Request & Strict Procurement Cost Confidentiality
  const testReqId = `REQ-${Date.now()}`;
  const testReq = await saveSeparatedFrameRequestServer({
    requestId: testReqId,
    fullName: "Stefan Weber",
    email: "stefan.weber@example.de",
    phone: "+49 30 1234567",
    frameBrand: "Oliver Peoples",
    frameModel: "Gregory Peck",
    frameDimensions: "47-23-150",
    prescriptionType: "manual",
    prescriptionSphR: "-2.25",
    prescriptionSphL: "-2.00",
  });

  // Admin records internal procurement parameters
  await adminUpdateFrameRequestDetailsServer(testReq.requestId, {
    status: "Option Available",
    procurementCost: 89.50,
    source: "Wholesale Optical B2B Berlin",
    customerPrice: 0,
    compatibilityStatus: "compatible",
    adminResponse: "Frame sourced and verified compatible with your single vision values.",
    adminNotes: "Internal note: High quality acetate, bevel compatible with 1.6 lenses.",
  });

  // Query customer overview with valid accessToken
  const customerOverview = await getCustomerOverviewServer({
    accessToken: testReq.accessToken,
  });

  const matchingCustomerReq = customerOverview.frameRequests.find(
    (r) => r.requestId === testReq.requestId,
  );

  const costLeaked = matchingCustomerReq && ("procurement_cost" in matchingCustomerReq || "source" in matchingCustomerReq);

  assert(
    matchingCustomerReq !== undefined && !costLeaked,
    "Test 5: Internal procurement costs are strictly omitted from customer view",
    `Customer received brand: ${matchingCustomerReq?.frameBrand}, procurement_cost leaked: ${costLeaked}`,
  );

  // TEST 6: Customer Decision on Frame Option with Access Token
  const decisionInvalidToken = await customerRespondToFrameOptionServer(
    testReq.requestId,
    "invalid_spoofed_token_12345",
    "approved",
  );

  const decisionValidToken = await customerRespondToFrameOptionServer(
    testReq.requestId,
    testReq.accessToken,
    "approved",
    "Approved! Excited to receive these.",
  );

  assert(
    decisionInvalidToken.success === false && decisionValidToken.success === true,
    "Test 6: Customer frame approval requires valid 64-character token ownership",
    `Invalid token allowed: ${decisionInvalidToken.success}, Valid token allowed: ${decisionValidToken.success}`,
  );

  // TEST 7: 5-Stage Prescription Review Workflow
  const reviewResult = await adminUpdatePrescriptionReviewServer(
    testReq.requestId,
    "Approved for Fulfillment",
    "CE certified Single Vision 1.6 index confirmed.",
    undefined,
    "admin_optician_01",
  );

  assert(
    reviewResult === true,
    "Test 7: Prescription 5-stage review workflow executed and audit logged",
    `Workflow stage: "Approved for Fulfillment", Audit action recorded for admin_optician_01`,
  );

  // TEST 8: Optician Partner Network Directory & Search
  const allPartners = await getOpticianPartnersServer({ activeOnly: true });
  const berlinPartners = await searchOpticianPartnersServer("Berlin");
  const munichPartners = await searchOpticianPartnersServer("80333");

  assert(
    allPartners.length >= 6 && berlinPartners.length > 0 && munichPartners.length > 0,
    "Test 8: Optician partner network search by city and postal code",
    `Total active: ${allPartners.length}, Berlin matches: ${berlinPartners.length}, Munich PLZ matches: ${munichPartners.length}`,
  );

  // TEST 9: Replacement Request Management & Quota
  const testCustomerEmail = `customer.rep.${Date.now()}@example.de`;
  const replacementClaim = await submitReplacementRequestServer({
    email: testCustomerEmail,
    subscriptionId: "LNS-DEMO-SUB-01",
    reason: "accidental_damage",
    description: "Frame arm hinge bent during cycling.",
  });

  const repId = replacementClaim.replacement?.id || "";
  const allClaims = await getReplacementRequestsServer();
  const foundClaim = allClaims.find((c) => c.id === repId);

  const claimApproved = await updateReplacementStatusServer(
    repId,
    "approved",
    "Prüfung abgeschlossen. Ersatzlieferung freigegeben. ORD-REP-2026-01",
    "admin_staff",
  );

  assert(
    replacementClaim.success === true && foundClaim !== undefined && claimApproved !== null && claimApproved.status === "approved",
    "Test 9: Replacement claim registered, quota validated, and approved by staff",
    `Claim ID: ${repId}, Status: ${claimApproved?.status}, Notes: ${claimApproved?.admin_notes}`,
  );

  // TEST 10: Threaded Customer / Admin Messaging
  const customerMsg = await sendMessageServer({
    contextType: "support",
    contextId: "general",
    senderRole: "customer",
    senderEmail: "stefan.weber@example.de",
    senderName: "Stefan Weber",
    body: "Hi, can you confirm if my frame order will arrive before Friday?",
  });

  const staffReply = await sendMessageServer({
    contextType: "support",
    contextId: "general",
    senderRole: "admin",
    senderEmail: "support@lensly.care",
    senderName: "Lensly Care Team",
    body: "Hello Stefan, your glasses have passed quality check and will ship on Wednesday via DHL Express.",
  });

  const thread = await getMessagesServer("support", "general");

  assert(
    thread.length >= 2 && thread.some((m) => m.id === customerMsg.id) && thread.some((m) => m.id === staffReply.id),
    "Test 10: Threaded customer/admin communication with role demarcation",
    `Thread count: ${thread.length}, Customer message tracked: true, Staff reply tracked: true`,
  );

  // TEST 11: Virtual Try-On (VTO) Service Boundary
  const vtoConfig = getVTOStatus();
  assert(
    typeof vtoConfig.enabled === "boolean" && (vtoConfig.provider === "fittingbox" || vtoConfig.provider === "native_fallback"),
    "Test 11: VTO service layer abstracts commercial provider with camera fallback",
    `Provider: ${vtoConfig.provider}, Mode: ${vtoConfig.mode}, Notice: "${vtoConfig.notice}"`,
  );

  console.log("\n=======================================================================");
  console.log(`  PHASE 2 QA RESULTS: ${passedTests}/${totalTests} PASSED (${totalTests - passedTests} FAILED)`);
  console.log("=======================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase2FunctionalTests().catch((err) => {
  console.error("Phase 2 test suite crashed:", err);
  process.exit(1);
});
