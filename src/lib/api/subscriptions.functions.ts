import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  saveSubscriptionServer,
  getSubscriptionsServer,
  updateSubscriptionStatusServer,
  confirmSubscriptionPaymentServer,
  deleteSubscriptionServer,
  editSubscriptionServer,
  getDeletedSubscriptionsServer,
  restoreSubscriptionServer,
  permanentlyDeleteSubscriptionServer,
} from "../subscriptions.server";
import { getServerConfig } from "../config.server";
import Stripe from "stripe";
import { createHash } from "node:crypto";

const ADMIN_PASSWORD_HASH = "a]lensly2026";

function verifyAdminPassword(password: string): boolean {
  const config = getServerConfig();
  
  // 1. Check custom environment variable password if configured
  if (config.adminPassword) {
    const envPassword = config.adminPassword;
    const envPasswordTrimmed = envPassword.replace(/\r/g, "").trim();
    if (password === envPassword || password === envPasswordTrimmed) {
      return true;
    }
  }
  
  // 2. Check fallback/hardcoded passwords
  const fallbackPasswords = ["lensly2026", "a]lensly2026"];
  if (fallbackPasswords.includes(password) || fallbackPasswords.includes(password.trim())) {
    return true;
  }
  
  return false;
}

// --- Server-side admin authentication ---
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const valid = verifyAdminPassword(data.password);
    if (!valid) {
      return { success: false, token: null };
    }
    
    // Stateless token: timestamp + signature of (timestamp + password)
    const timestamp = Date.now();
    const config = getServerConfig();
    const secret = config.adminPassword || "lensly2026";
    const signature = createHash("sha256")
      .update(`${timestamp}:${secret}`)
      .digest("hex");
    const token = `${timestamp}:${signature}`;
    
    return { success: true, token };
  });

const verificationCodes = new Map<string, { emailCode: string; phoneCode: string; expires: number }>();

function isValidAdminToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;
  
  // 12 hours expiration
  if (Date.now() - timestamp > 12 * 60 * 60 * 1000) {
    return false;
  }
  
  const config = getServerConfig();
  const secret = config.adminPassword || "lensly2026";
  const expectedSignature = createHash("sha256")
    .update(`${timestampStr}:${secret}`)
    .digest("hex");
    
  return signature === expectedSignature;
}

// --- Public endpoints (no auth required) ---

export const saveSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      birthDate: z.string().min(1),
      birthPlace: z.string().min(1),
      profession: z.string().min(1),
      streetAddress: z.string().min(1),
      postalCode: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      country: z.string().optional(),
      paymentMethod: z.enum(["sepa", "wallet"]),
      maskedIban: z.string().optional(),
      signatureType: z.enum(["draw", "type"]),
      signatureData: z.string().min(1),
      status: z.enum(["active", "cancelled", "withdrawn", "pending"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const saved = await saveSubscriptionServer({
      contract_id: data.contractId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      birth_date: data.birthDate,
      birth_place: data.birthPlace,
      profession: data.profession,
      street_address: data.streetAddress,
      postal_code: data.postalCode,
      city: data.city,
      state: data.state,
      country: data.country,
      payment_method: data.paymentMethod,
      masked_iban: data.maskedIban,
      signature_type: data.signatureType,
      signature_data: data.signatureData,
      status: data.status || "active",
    });
    return {
      contractId: saved.contract_id,
      fullName: saved.full_name,
      email: saved.email,
      phone: saved.phone,
      birthDate: saved.birth_date,
      birthPlace: saved.birth_place,
      profession: saved.profession,
      streetAddress: saved.street_address,
      postalCode: saved.postal_code,
      city: saved.city,
      state: saved.state,
      country: saved.country,
      paymentMethod: saved.payment_method,
      maskedIban: saved.masked_iban,
      signatureType: saved.signature_type,
      signatureData: saved.signature_data,
      status: saved.status,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  });

// Public: customer-initiated cancel/withdraw (no admin token needed)
export const updateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      status: z.enum(["active", "cancelled", "withdrawn"]),
    }),
  )
  .handler(async ({ data }) => {
    return await updateSubscriptionStatusServer(data.contractId, data.email, data.status);
  });

// --- Admin-only endpoints (require valid token) ---

export const getSubscriptions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    const list = await getSubscriptionsServer();
    return list.map((item) => ({
      id: item.id,
      contractId: item.contract_id,
      fullName: item.full_name,
      email: item.email,
      phone: item.phone,
      birthDate: item.birth_date,
      birthPlace: item.birth_place,
      profession: item.profession,
      streetAddress: item.street_address,
      postalCode: item.postal_code,
      city: item.city,
      paymentMethod: item.payment_method,
      maskedIban: item.masked_iban,
      signatureType: item.signature_type,
      signatureData: item.signature_data,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  });

// Admin-only status update (with token validation)
export const adminUpdateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
      contractId: z.string().min(1),
      email: z.string().email(),
      status: z.enum(["active", "cancelled", "withdrawn", "paused", "archived"]),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    return await updateSubscriptionStatusServer(data.contractId, data.email, data.status);
  });

export const adminDeleteSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
      contractId: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    return await deleteSubscriptionServer(data.contractId, data.email);
  });

export const adminEditSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
      contractId: z.string().min(1),
      email: z.string().email(),
      updatedFields: z.object({
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        birthPlace: z.string().optional(),
        profession: z.string().optional(),
        streetAddress: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        status: z.enum(["active", "cancelled", "withdrawn", "pending", "paused", "archived"]).optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    return await editSubscriptionServer(data.contractId, data.email, {
      full_name: data.updatedFields.fullName,
      email: data.updatedFields.email,
      phone: data.updatedFields.phone,
      birth_date: data.updatedFields.birthDate,
      birth_place: data.updatedFields.birthPlace,
      profession: data.updatedFields.profession,
      street_address: data.updatedFields.streetAddress,
      postal_code: data.updatedFields.postalCode,
      city: data.updatedFields.city,
      state: data.updatedFields.state,
      country: data.updatedFields.country,
      status: data.updatedFields.status,
    });
  });

export const getDeletedSubscriptions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    const list = await getDeletedSubscriptionsServer();
    return list.map((item) => ({
      id: item.id,
      contractId: item.contract_id,
      fullName: item.full_name,
      email: item.email,
      phone: item.phone,
      birthDate: item.birth_date,
      birthPlace: item.birth_place,
      profession: item.profession,
      streetAddress: item.street_address,
      postalCode: item.postal_code,
      city: item.city,
      paymentMethod: item.payment_method,
      maskedIban: item.masked_iban,
      signatureType: item.signature_type,
      signatureData: item.signature_data,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  });

export const restoreSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
      contractId: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    return await restoreSubscriptionServer(data.contractId, data.email);
  });

export const permanentlyDeleteSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminToken: z.string().min(1),
      contractId: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    if (!isValidAdminToken(data.adminToken)) {
      throw new Error("Unauthorized: invalid admin token");
    }
    return await permanentlyDeleteSubscriptionServer(data.contractId, data.email);
  });

// --- Stripe Checkout Endpoints ---

export const checkStripeConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const config = getServerConfig();
    return { enabled: !!config.stripeSecretKey };
  });

export const createStripeSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      birthDate: z.string().min(1),
      birthPlace: z.string().min(1),
      profession: z.string().min(1),
      streetAddress: z.string().min(1),
      postalCode: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      country: z.string().optional(),
      paymentMethod: z.enum(["sepa", "wallet"]),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    if (!config.stripeSecretKey) {
      throw new Error("Stripe secret key is not configured.");
    }

    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const customers = await stripe.customers.list({
      email: data.email,
      limit: 1,
    });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.fullName,
        phone: data.phone,
        metadata: {
          birth_date: data.birthDate,
          birth_place: data.birthPlace,
          profession: data.profession,
        },
        shipping: {
          name: data.fullName,
          address: {
            line1: data.streetAddress,
            postal_code: data.postalCode,
            city: data.city,
            state: data.state || undefined,
            country: data.country || "DE",
          },
        },
      });
      customerId = customer.id;
    }

    let priceId = config.stripePriceId;
    if (!priceId) {
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find((p) => p.name === "Lensly Care Subscription");
      if (!product) {
        product = await stripe.products.create({
          name: "Lensly Care Subscription",
          description: "Premium prescription eyewear delivered to your door every year with 3 free replacements.",
        });
      }

      const prices = await stripe.prices.list({ product: product.id });
      let price = prices.data.find((p) => p.unit_amount === 2900 && p.recurring?.interval === "month");
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: 2900,
          currency: "eur",
          recurring: {
            interval: "month",
          },
        });
      }
      priceId = price.id;
    }

    const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
      data.paymentMethod === "sepa" ? ["sepa_debit"] : ["card"];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${data.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      metadata: {
        contractId: data.contractId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        birthPlace: data.birthPlace,
        profession: data.profession,
        streetAddress: data.streetAddress,
        postalCode: data.postalCode,
        city: data.city,
        state: data.state || "",
        country: data.country || "",
        paymentMethod: data.paymentMethod,
      },
    });

    return { sessionUrl: session.url };
  });

export const confirmStripeSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    if (!config.stripeSecretKey) {
      throw new Error("Stripe secret key is not configured.");
    }

    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    if (!session || session.payment_status !== "paid") {
      throw new Error("Payment not completed.");
    }

    const contractId = session.metadata?.contractId;
    const email = session.metadata?.email;
    const paymentMethod = session.metadata?.paymentMethod as "sepa" | "wallet" | undefined;

    if (!contractId || !email || !paymentMethod) {
      throw new Error("Missing contract metadata in Stripe checkout session.");
    }

    let maskedIban = "Stripe Secured";
    if (session.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
        expand: ["payment_method"],
      });
      const pm = pi.payment_method as Stripe.PaymentMethod | null;
      if (pm) {
        if (pm.type === "sepa_debit" && pm.sepa_debit) {
          maskedIban = `${(pm.sepa_debit.country || "DE").toUpperCase()}** **** **** **** ${pm.sepa_debit.last4}`;
        } else if (pm.type === "card" && pm.card) {
          maskedIban = `${pm.card.brand.toUpperCase()} **** **** **** ${pm.card.last4}`;
        }
      }
    } else if (session.subscription) {
      const subs = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ["default_payment_method"],
      });
      const pm = subs.default_payment_method as Stripe.PaymentMethod | null;
      if (pm) {
        if (pm.type === "sepa_debit" && pm.sepa_debit) {
          maskedIban = `${(pm.sepa_debit.country || "DE").toUpperCase()}** **** **** **** ${pm.sepa_debit.last4}`;
        } else if (pm.type === "card" && pm.card) {
          maskedIban = `${pm.card.brand.toUpperCase()} **** **** **** ${pm.card.last4}`;
        }
      }
    }

    await confirmSubscriptionPaymentServer(contractId, email, paymentMethod, maskedIban);

    const updatedList = await getSubscriptionsServer();
    const updated = updatedList.find((s) => s.contract_id === contractId);
    if (!updated) {
      throw new Error("Subscription not found after update.");
    }

    return {
      contractId: updated.contract_id,
      fullName: updated.full_name,
      email: updated.email,
      phone: updated.phone,
      birthDate: updated.birth_date,
      birthPlace: updated.birth_place,
      profession: updated.profession,
      streetAddress: updated.street_address || "",
      postalCode: updated.postal_code || "",
      city: updated.city || "",
      state: updated.state || "",
      country: updated.country || "",
      paymentMethod: updated.payment_method,
      maskedIban: updated.masked_iban,
      signatureType: updated.signature_type,
      signatureData: updated.signature_data,
      status: updated.status,
      timestamp: updated.created_at || new Date().toISOString(),
    };
  });

export const sendVerificationCodes = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      phone: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    verificationCodes.set(`${data.email.toLowerCase()}|${data.phone.trim()}`, {
      emailCode,
      phoneCode,
      expires,
    });

    console.log(`[VERIFICATION CODE] Sent to email ${data.email}: ${emailCode}`);
    console.log(`[VERIFICATION CODE] Sent to phone ${data.phone}: ${phoneCode}`);

    return {
      success: true,
      devCodes: { emailCode, phoneCode },
    };
  });

export const verifyCodes = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      phone: z.string().min(1),
      emailCode: z.string().length(6),
      phoneCode: z.string().length(6),
    }),
  )
  .handler(async ({ data }) => {
    const key = `${data.email.toLowerCase()}|${data.phone.trim()}`;
    const record = verificationCodes.get(key);

    if (!record) {
      return { valid: false, error: "Verification codes not found. Please request a new code." };
    }

    if (Date.now() > record.expires) {
      verificationCodes.delete(key);
      return { valid: false, error: "Verification codes expired. Please request a new code." };
    }

    if (record.emailCode !== data.emailCode) {
      return { valid: false, error: "Invalid email verification code." };
    }

    if (record.phoneCode !== data.phoneCode) {
      return { valid: false, error: "Invalid phone verification code." };
    }

    verificationCodes.delete(key);
    return { valid: true };
  });

export const clientConfirmPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      paymentMethod: z.enum(["sepa", "wallet"]),
      maskedIban: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const success = await confirmSubscriptionPaymentServer(
      data.contractId,
      data.email,
      data.paymentMethod,
      data.maskedIban || "Stripe Card Payment"
    );
    return { success };
  });
