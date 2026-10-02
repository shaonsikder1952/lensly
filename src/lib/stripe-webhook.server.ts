import Stripe from "stripe";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getServerConfig } from "./config.server";
import { getSqlClient, ensureDbInitialized, getSubscriptionsServer } from "./subscriptions.server";
import { createCustomerHandoffServer } from "./customer-session.server";
import { getDataFilePath } from "./data-dir.server";

export interface ProcessedStripeEvent {
  event_id: string;
  event_type: string;
  processed_at: string;
}

const STRIPE_EVENTS_FILE_PATH = getDataFilePath("stripe_events.json");

/**
 * Idempotency record store for Stripe webhook events.
 */
export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  await ensureDbInitialized();
  const client = getSqlClient();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction || client) {
    if (!client) throw new Error("PostgreSQL client unavailable for stripe event verification");
    const rows = await client`
      SELECT event_id FROM stripe_events WHERE event_id = ${eventId.trim()} LIMIT 1
    `;
    return Boolean(rows && rows.length > 0);
  }

  // Development JSON fallback
  try {
    const raw = await fs.readFile(STRIPE_EVENTS_FILE_PATH, "utf-8");
    const list = JSON.parse(raw) as ProcessedStripeEvent[];
    return list.some((e) => e.event_id === eventId.trim());
  } catch {
    return false;
  }
}

export async function markStripeEventProcessed(eventId: string, eventType: string): Promise<void> {
  await ensureDbInitialized();
  const client = getSqlClient();
  const isProduction = process.env.NODE_ENV === "production";
  const now = new Date().toISOString();

  if (isProduction || client) {
    if (!client) throw new Error("PostgreSQL client unavailable for recording stripe event");
    await client`
      INSERT INTO stripe_events (event_id, event_type, processed_at)
      VALUES (${eventId.trim()}, ${eventType.trim()}, ${now})
      ON CONFLICT (event_id) DO NOTHING
    `;
    return;
  }

  // Development JSON fallback
  let list: ProcessedStripeEvent[] = [];
  try {
    const raw = await fs.readFile(STRIPE_EVENTS_FILE_PATH, "utf-8");
    list = JSON.parse(raw);
  } catch {}

  if (!list.some((e) => e.event_id === eventId.trim())) {
    list.unshift({ event_id: eventId.trim(), event_type: eventType.trim(), processed_at: now });
    await fs.writeFile(STRIPE_EVENTS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  }
}

/**
 * Updates a subscription with verified Stripe identifiers and status.
 */
export async function updateSubscriptionStripeState(
  identifier: { contractId?: string; email?: string; stripeCustomerId?: string; stripeSubscriptionId?: string },
  updates: {
    status?: "active" | "pending" | "past_due" | "cancelled" | "withdrawn";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeCheckoutSessionId?: string;
    stripeLatestInvoiceId?: string;
  },
): Promise<boolean> {
  await ensureDbInitialized();
  const client = getSqlClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      if (identifier.contractId) {
        await client`
          UPDATE subscriptions SET
            status = COALESCE(${updates.status ?? null}, status),
            stripe_customer_id = COALESCE(${updates.stripeCustomerId ?? null}, stripe_customer_id),
            stripe_subscription_id = COALESCE(${updates.stripeSubscriptionId ?? null}, stripe_subscription_id),
            stripe_checkout_session_id = COALESCE(${updates.stripeCheckoutSessionId ?? null}, stripe_checkout_session_id),
            stripe_latest_invoice_id = COALESCE(${updates.stripeLatestInvoiceId ?? null}, stripe_latest_invoice_id),
            updated_at = ${now}
          WHERE contract_id = ${identifier.contractId}
        `;
        return true;
      }
      if (identifier.stripeSubscriptionId) {
        await client`
          UPDATE subscriptions SET
            status = COALESCE(${updates.status ?? null}, status),
            stripe_latest_invoice_id = COALESCE(${updates.stripeLatestInvoiceId ?? null}, stripe_latest_invoice_id),
            updated_at = ${now}
          WHERE stripe_subscription_id = ${identifier.stripeSubscriptionId}
        `;
        return true;
      }
    } catch (err) {
      console.error("[StripeState] PostgreSQL update error:", err);
    }
  }

  // File fallback in development
  const filePath = getDataFilePath("subscriptions.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const list = JSON.parse(raw);
    let matched = false;

    const updatedList = list.map((item: any) => {
      const matchContract = identifier.contractId && (item.contract_id === identifier.contractId || item.contractId === identifier.contractId);
      const matchStripeSub = identifier.stripeSubscriptionId && item.stripe_subscription_id === identifier.stripeSubscriptionId;
      const matchEmail = identifier.email && item.email?.toLowerCase() === identifier.email.toLowerCase();

      if (matchContract || matchStripeSub || matchEmail) {
        matched = true;
        return {
          ...item,
          status: updates.status || item.status,
          stripe_customer_id: updates.stripeCustomerId || item.stripe_customer_id,
          stripe_subscription_id: updates.stripeSubscriptionId || item.stripe_subscription_id,
          stripe_checkout_session_id: updates.stripeCheckoutSessionId || item.stripe_checkout_session_id,
          stripe_latest_invoice_id: updates.stripeLatestInvoiceId || item.stripe_latest_invoice_id,
          updated_at: now,
        };
      }
      return item;
    });

    if (matched) {
      await fs.writeFile(filePath, JSON.stringify(updatedList, null, 2), "utf-8");
      return true;
    }
  } catch (err) {
    console.error("[StripeState] JSON fallback error:", err);
  }

  return false;
}

/**
 * Handles incoming raw Stripe Webhook payload using official Stripe Node SDK verification.
 * Strictly guarantees idempotency and state machine validity.
 */
export async function handleStripeWebhookServer(
  rawBody: string | Buffer,
  signatureHeader: string | null,
): Promise<{ received: boolean; eventId: string; eventType: string; status: string }> {
  const config = getServerConfig();
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw new Error("Stripe secret key or webhook secret is not configured on the server.");
  }

  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header");
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia" as any,
  });

  // 1. Official SDK Webhook Signature Verification
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      config.stripeWebhookSecret,
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  // 2. Persistent Idempotency Check
  const alreadyProcessed = await isStripeEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`[Stripe Webhook] Duplicate event ignored (idempotent): ${event.id} [${event.type}]`);
    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      status: "ignored_duplicate",
    };
  }

  // 3. Centralized State Machine Processing
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const contractId = session.client_reference_id || (session.metadata?.contractId as string) || (session.metadata?.contract_id as string);
      const customerEmail = (session.customer_details?.email || (session.metadata?.customerEmail as string) || (session.metadata?.customer_email as string) || session.customer_email || "").trim().toLowerCase();

      let targetStatus: "active" | "pending" = "pending";

      // Verify payment status and underlying subscription
      if (session.payment_status === "paid") {
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            if (sub.status === "active" || sub.status === "trialing") {
              targetStatus = "active";
            } else {
              targetStatus = "pending";
            }
          } catch {
            targetStatus = "active"; // One-time or fallback
          }
        } else {
          targetStatus = "active";
        }
      } else {
        // Asynchronous payment processing (e.g. SEPA direct debit pending authorization)
        targetStatus = "pending";
      }

      await updateSubscriptionStripeState(
        { contractId, email: customerEmail },
        {
          status: targetStatus,
          stripeCustomerId: (session.customer as string) || undefined,
          stripeSubscriptionId: (session.subscription as string) || undefined,
          stripeCheckoutSessionId: session.id,
        },
      );
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = ((invoice as any).subscription as string) || undefined;
      const customerId = (invoice.customer as string) || undefined;

      // Verify underlying subscription is in good standing
      let isSubscriptionActive = true;
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          isSubscriptionActive = sub.status === "active" || sub.status === "trialing";
        } catch {}
      }

      if (isSubscriptionActive) {
        await updateSubscriptionStripeState(
          { stripeSubscriptionId: subId, stripeCustomerId: customerId },
          {
            status: "active",
            stripeLatestInvoiceId: invoice.id,
          },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = ((invoice as any).subscription as string) || undefined;
      const customerId = (invoice.customer as string) || undefined;

      await updateSubscriptionStripeState(
        { stripeSubscriptionId: subId, stripeCustomerId: customerId },
        {
          status: "past_due",
          stripeLatestInvoiceId: invoice.id,
        },
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await updateSubscriptionStripeState(
        { stripeSubscriptionId: sub.id, stripeCustomerId: sub.customer as string },
        {
          status: "cancelled",
        },
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      let mappedStatus: "active" | "pending" | "past_due" | "cancelled" = "pending";

      if (sub.status === "active" || sub.status === "trialing") {
        mappedStatus = "active";
      } else if (sub.status === "past_due" || sub.status === "unpaid") {
        mappedStatus = "past_due";
      } else if (sub.status === "canceled") {
        mappedStatus = "cancelled";
      }

      await updateSubscriptionStripeState(
        { stripeSubscriptionId: sub.id, stripeCustomerId: sub.customer as string },
        {
          status: mappedStatus,
        },
      );
      break;
    }
  }

  // 4. Mark event processed permanently
  await markStripeEventProcessed(event.id, event.type);

  return {
    received: true,
    eventId: event.id,
    eventType: event.type,
    status: "processed",
  };
}

/**
 * Verifies a Stripe Checkout Session server-side and creates a single-use customer handoff code.
 * Rejects client-supplied identities; strictly derives identity from verified Stripe & DB records.
 */
export async function verifyAndCreateCustomerHandoffFromStripe(
  sessionId: string,
): Promise<{
  success: boolean;
  handoffToken?: string;
  paymentStatus: "paid" | "unpaid" | "processing";
  subscriptionStatus: "active" | "pending";
  contractId?: string;
}> {
  const config = getServerConfig();
  if (!config.stripeSecretKey) {
    throw new Error("Stripe secret key is not configured");
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia" as any,
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    throw new Error("Stripe checkout session not found");
  }

  // Obtain verified customer email from Stripe session
  const customerEmail = (
    session.customer_details?.email ||
    (session.metadata?.customerEmail as string) ||
    session.customer_email ||
    ""
  ).trim().toLowerCase();

  if (!customerEmail || !customerEmail.includes("@")) {
    throw new Error("No verified customer email found in Stripe Checkout Session");
  }

  const contractId = session.client_reference_id || (session.metadata?.contractId as string) || (session.metadata?.contract_id as string) || undefined;

  // Cross-customer security validation:
  // If the contract exists in the database, verify that its owner matches the verified Stripe email
  if (contractId) {
    const subscriptions = await getSubscriptionsServer();
    const existingSub = subscriptions.find(
      (s) => (s.contract_id || (s as any).contractId) === contractId,
    );
    if (existingSub && existingSub.email.trim().toLowerCase() !== customerEmail) {
      throw new Error("Forbidden: Stripe Checkout Session does not match the subscription owner");
    }
  }

  // Verify underlying subscription and payment state
  let paymentStatus: "paid" | "unpaid" | "processing" = "unpaid";
  let subscriptionStatus: "active" | "pending" = "pending";

  if (session.payment_status === "paid") {
    paymentStatus = "paid";
    if (session.subscription) {
      try {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        if (sub.status === "active" || sub.status === "trialing") {
          subscriptionStatus = "active";
        } else {
          subscriptionStatus = "pending";
        }
      } catch {
        subscriptionStatus = "active";
      }
    } else {
      subscriptionStatus = "active";
    }
  } else {
    // Asynchronous payment method processing (e.g. SEPA bank transfer)
    paymentStatus = "processing";
    subscriptionStatus = "pending";
  }

  // Update subscription record with verified Stripe identifiers
  await updateSubscriptionStripeState(
    { contractId, email: customerEmail },
    {
      status: subscriptionStatus,
      stripeCustomerId: (session.customer as string) || undefined,
      stripeSubscriptionId: (session.subscription as string) || undefined,
      stripeCheckoutSessionId: session.id,
    },
  );

  // Generate single-use handoff code strictly for this server-verified customer
  const handoffToken = await createCustomerHandoffServer(customerEmail, contractId);

  return {
    success: true,
    handoffToken,
    paymentStatus,
    subscriptionStatus,
    contractId,
  };
}

/**
 * Required production Stripe environment variables.
 */
export const REQUIRED_STRIPE_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
] as const;
