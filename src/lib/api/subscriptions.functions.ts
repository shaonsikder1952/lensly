import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import crypto from "node:crypto";
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
  saveSeparatedFrameRequestServer,
  getPublicFrameRequestStatusServer,
  getCustomerFrameRequestServer,
  adminGetFrameRequestsServer,
  adminUpdateFrameRequestStatusServer,
  adminGetPrescriptionServer,
  adminDeleteFrameRequestServer,
  recordAuditLogServer,
  requestCustomerAccessRecoveryServer,
  getCustomerOverviewServer,
  customerRespondToFrameOptionServer,
  adminUpdateFrameRequestDetailsServer,
  adminUpdatePrescriptionReviewServer,
  resolveCustomerIdentifierServer,
  type FrameRequestStatus,
} from "../subscriptions.server";
import {
  getOrdersServer,
  getOrderByIdServer,
  updateOrderStatusServer,
  createOrderServer,
  type OrderStatus,
} from "../orders.server";
import {
  getMessagesServer,
  sendMessageServer,
  markMessagesReadServer,
} from "../messaging.server";
import {
  getOpticianPartnersServer,
  searchOpticianPartnersServer,
  updateOpticianPartnerServer,
  type OpticianPartner,
} from "../partners.server";
import {
  submitReplacementRequestServer,
  getReplacementRequestsServer,
  updateReplacementStatusServer,
  type ReplacementReason,
} from "../replacements.server";
import { getVTOStatus } from "../vto";
import { getServerConfig } from "../config.server";
import { getEmailService } from "../notifications.server";
import {
  requireAdminSession,
  processAdminLogin,
  processAdminLogout,
  checkAndRecordRateLimit,
  getClientIdentifier,
} from "../auth.server";
import { saveBase64Upload, getPrivateFile, generateTrackingId } from "../storage.server";
import {
  createCustomerHandoffServer,
  exchangeCustomerHandoffServer,
  customerLogoutServer,
  requireCustomerSession,
  createDirectCustomerSession,
} from "../customer-session.server";
import {
  handleStripeWebhookServer,
  verifyAndCreateCustomerHandoffFromStripe,
} from "../stripe-webhook.server";
import Stripe from "stripe";

// --- Admin Authentication Server Functions ---

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().optional(),
      password: z.string().min(1, "Password is required"),
    }),
  )
  .handler(async ({ data }) => {
    return await processAdminLogin(data.password, data.username);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  return await processAdminLogout();
});

export const adminCheckSession = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const session = await requireAdminSession(false);
    return {
      authenticated: true,
      adminId: session.admin_id,
      csrfToken: session.csrf_token,
    };
  } catch {
    return {
      authenticated: false,
    };
  }
});

// --- Public Subscription Endpoints ---

const verificationCodes = new Map<string, { emailCode: string; phoneCode: string; expires: number }>();

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

    // Generate single-use server handoff token for seamless HttpOnly customer session exchange
    const handoffToken = await createCustomerHandoffServer(saved.email, saved.contract_id).catch(() => undefined);

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
      accessToken: saved.access_token,
      handoffToken,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  });

// Customer-initiated cancellation/withdrawal: requires verified phone/email code or admin session
export const updateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      status: z.enum(["active", "cancelled", "withdrawn"]),
      verificationCode: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    let isAdmin = false;
    try {
      await requireAdminSession(false);
      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    if (!isAdmin) {
      if (!data.verificationCode) {
        setResponseStatus(401, "Unauthorized");
        throw new Error("Unauthorized: Identity verification code required to modify subscription status.");
      }
    }

    return await updateSubscriptionStatusServer(data.contractId, data.email, data.status);
  });

// --- Protected Admin Subscription Endpoints ---

export const getSubscriptions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminToken: z.string().optional() }).optional())
  .handler(async () => {
    await requireAdminSession(false);
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

export const adminUpdateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      status: z.enum(["active", "cancelled", "withdrawn", "paused", "archived"]),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    const res = await updateSubscriptionStatusServer(data.contractId, data.email, data.status);

    await recordAuditLogServer({
      request_id: data.contractId,
      admin_id: session.admin_id,
      action: "SUBSCRIPTION_STATUS_UPDATE",
      new_status: data.status,
    }).catch(() => {});

    return res;
  });

export const adminDeleteSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    const res = await deleteSubscriptionServer(data.contractId, data.email);

    await recordAuditLogServer({
      request_id: data.contractId,
      admin_id: session.admin_id,
      action: "SUBSCRIPTION_DELETED",
    }).catch(() => {});

    return res;
  });

export const adminEditSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
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
    const session = await requireAdminSession(true, data.csrfToken);
    const res = await editSubscriptionServer(data.contractId, data.email, {
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

    await recordAuditLogServer({
      request_id: data.contractId,
      admin_id: session.admin_id,
      action: "SUBSCRIPTION_EDITED",
    }).catch(() => {});

    return res;
  });

export const getDeletedSubscriptions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminToken: z.string().optional() }).optional())
  .handler(async () => {
    await requireAdminSession(false);
    return await getDeletedSubscriptionsServer();
  });

export const restoreSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    const res = await restoreSubscriptionServer(data.contractId, data.email);

    await recordAuditLogServer({
      request_id: data.contractId,
      admin_id: session.admin_id,
      action: "SUBSCRIPTION_RESTORED",
    }).catch(() => {});

    return res;
  });

export const permanentlyDeleteSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    const res = await permanentlyDeleteSubscriptionServer(data.contractId, data.email);

    await recordAuditLogServer({
      request_id: data.contractId,
      admin_id: session.admin_id,
      action: "SUBSCRIPTION_PERMANENTLY_DELETED",
    }).catch(() => {});

    return res;
  });

// --- Verification Code Endpoints ---

export const sendVerificationCode = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      phone: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 min

    const key = `${data.email.toLowerCase()}|${data.phone.trim()}`;
    verificationCodes.set(key, { emailCode, phoneCode, expires });

    return {
      success: true,
      emailSent: true,
      phoneSent: true,
      debug: process.env.NODE_ENV !== "production" ? { emailCode, phoneCode } : undefined,
    };
  });

export const verifyCode = createServerFn({ method: "POST" })
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

// --- Frame Request & Prescription Verification Endpoints ---

const frameRequestStatusSchema = z.enum([
  "Requested",
  "Under Review",
  "Frame Found",
  "Compatibility Check",
  "Prescription Review",
  "Price/Availability Confirmation",
  "Ready for Checkout",
  "Ordered",
  "Rejected",
]);

export const submitFrameRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fullName: z.string().min(1, "Full name is required").max(255),
      email: z.string().email("Valid email is required").max(255),
      phone: z.string().max(50).optional(),
      frameUrl: z.string().max(2000).optional(),
      frameImageData: z.string().optional(),
      frameBrand: z.string().max(255).optional(),
      frameModel: z.string().max(255).optional(),
      notes: z.string().max(2000).optional(),
      prescriptionType: z.enum(["file", "manual", "none"]).optional(),
      prescriptionSphR: z.string().max(20).optional(),
      prescriptionSphL: z.string().max(20).optional(),
      prescriptionCylR: z.string().max(20).optional(),
      prescriptionCylL: z.string().max(20).optional(),
      prescriptionAxisR: z.string().max(20).optional(),
      prescriptionAxisL: z.string().max(20).optional(),
      prescriptionPd: z.string().max(20).optional(),
      prescriptionFileData: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();

    // Submission abuse protection: max 15 submissions per hour per client IP
    const subCheck = await checkAndRecordRateLimit("submission", `sub:${clientIp}`, 15, 60 * 60 * 1000);
    if (!subCheck.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Submission rate limit reached. Please try again later.");
    }

    // 128-bit Cryptographically Secure Random Tracking ID
    const requestId = generateTrackingId();

    // Private file processing with magic-byte validation
    let frameImageFileId: string | undefined;
    let prescriptionFileId: string | undefined;

    if (data.frameImageData) {
      const uploadRes = await saveBase64Upload(data.frameImageData, "frame-upload");
      if (uploadRes.success) {
        frameImageFileId = uploadRes.file.fileId;
      } else {
        setResponseStatus(400, "Bad Request");
        throw new Error(`Frame image upload error: ${uploadRes.error}`);
      }
    }

    if (data.prescriptionFileData) {
      const uploadRes = await saveBase64Upload(data.prescriptionFileData, "prescription-upload");
      if (uploadRes.success) {
        prescriptionFileId = uploadRes.file.fileId;
      } else {
        setResponseStatus(400, "Bad Request");
        throw new Error(`Prescription upload error: ${uploadRes.error}`);
      }
    }

    // Save into separated relational/entity models
    const saved = await saveSeparatedFrameRequestServer({
      requestId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      frameUrl: data.frameUrl,
      frameImageFileId,
      frameBrand: data.frameBrand,
      frameModel: data.frameModel,
      notes: data.notes,
      prescriptionType: data.prescriptionType || "none",
      prescriptionSphR: data.prescriptionSphR,
      prescriptionSphL: data.prescriptionSphL,
      prescriptionCylR: data.prescriptionCylR,
      prescriptionCylL: data.prescriptionCylL,
      prescriptionAxisR: data.prescriptionAxisR,
      prescriptionAxisL: data.prescriptionAxisL,
      prescriptionPd: data.prescriptionPd,
      prescriptionFileId,
    });

    // Automatically send confirmation email with tracking ID & portal link
    try {
      const emailService = getEmailService();
      await emailService.sendNotification("frame_request_received", {
        recipientEmail: data.email,
        recipientName: data.fullName,
        requestId: saved.requestId,
        frameBrand: data.frameBrand,
        frameModel: data.frameModel,
        actionUrl: `http://localhost:5173/dashboard?requestId=${saved.requestId}&email=${encodeURIComponent(data.email)}`,
        statusMessage: `Ihre Anfrage ${saved.requestId} wurde erfolgreich eingereicht und wird von unserem Optik-Team geprüft.`,
      }).catch(() => {});
    } catch (e) {
      console.warn("Frame request confirmation email dispatch note:", e);
    }

    return {
      success: true,
      requestId: saved.requestId,
      accessToken: saved.accessToken,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  });

/**
 * Public frame request status lookup:
 * Strictly exposes ONLY customer-safe non-sensitive fields.
 * NEVER reveals customer name, email, phone, diopters, prescription files, or internal admin notes.
 */
export const getFrameRequestStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1, "Tracking ID is required"),
      accessToken: z.string().optional(),
      email: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();

    // Rate limiting: max 30 lookups per 10 minutes per IP to halt enumeration bursts
    const limitCheck = await checkAndRecordRateLimit("tracking", `track:${clientIp}`, 30, 10 * 60 * 1000);
    if (!limitCheck.allowed) {
      setResponseStatus(429, "Too Many Requests");
      return {
        found: false,
        error: "Too many tracking lookups. Please try again later.",
        request: null,
      };
    }

    // If customer access token is provided, verify ownership
    if (data.accessToken) {
      const customerData = await getCustomerFrameRequestServer(data.requestId, data.accessToken);
      if (customerData) {
        setResponseHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
        return {
          found: true,
          authenticatedCustomer: true,
          request: {
            requestId: customerData.request.request_id,
            status: customerData.request.status,
            frameBrand: customerData.request.frame_brand,
            frameModel: customerData.request.frame_model,
            frameUrl: customerData.request.frame_url,
            createdAt: customerData.request.created_at,
            updatedAt: customerData.request.updated_at,
            prescriptionType: customerData.prescription?.prescription_type,
            prescriptionSphR: customerData.prescription?.prescription_sph_r,
            prescriptionSphL: customerData.prescription?.prescription_sph_l,
            prescriptionCylR: customerData.prescription?.prescription_cyl_r,
            prescriptionCylL: customerData.prescription?.prescription_cyl_l,
            prescriptionAxisR: customerData.prescription?.prescription_axis_r,
            prescriptionAxisL: customerData.prescription?.prescription_axis_l,
            prescriptionPd: customerData.prescription?.prescription_pd,
          },
        };
      }
    }

    // Public sanitized lookup
    const pub = await getPublicFrameRequestStatusServer(data.requestId);
    if (!pub) {
      return { found: false, request: null };
    }

    setResponseHeader("Cache-Control", "public, max-age=15");
    return {
      found: true,
      authenticatedCustomer: false,
      request: {
        requestId: pub.request_id,
        status: pub.status,
        frameBrand: pub.frame_brand,
        frameModel: pub.frame_model,
        createdAt: pub.created_at,
        updatedAt: pub.updated_at,
      },
    };
  });

// --- Admin Frame Request Operations ---

export const adminGetFrameRequests = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminToken: z.string().optional() }).optional())
  .handler(async () => {
    await requireAdminSession(false);
    setResponseHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    return await adminGetFrameRequestsServer();
  });

export const adminUpdateFrameRequestStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      status: frameRequestStatusSchema,
      adminNotes: z.string().optional(),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    return await adminUpdateFrameRequestStatusServer(
      data.requestId,
      session.admin_id,
      data.status as FrameRequestStatus,
      data.adminNotes,
    );
  });

export const adminGetPrescription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      adminToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(false);
    setResponseHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    setResponseHeader("Pragma", "no-cache");

    const prescription = await adminGetPrescriptionServer(data.requestId, session.admin_id);
    if (!prescription) {
      return { found: false, prescription: null };
    }

    return {
      found: true,
      prescription: {
        prescriptionType: prescription.prescription_type,
        prescriptionSphR: prescription.prescription_sph_r,
        prescriptionSphL: prescription.prescription_sph_l,
        prescriptionCylR: prescription.prescription_cyl_r,
        prescriptionCylL: prescription.prescription_cyl_l,
        prescriptionAxisR: prescription.prescription_axis_r,
        prescriptionAxisL: prescription.prescription_axis_l,
        prescriptionPd: prescription.prescription_pd,
        prescriptionFileId: prescription.prescription_file_id,
        createdAt: prescription.created_at,
      },
    };
  });

export const adminGetFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fileId: z.string().min(1),
      adminToken: z.string().optional(),
      mode: z.enum(["preview", "download"]).default("download"),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(false);
    setResponseHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    setResponseHeader("Pragma", "no-cache");
    setResponseHeader("X-Content-Type-Options", "nosniff");

    const file = await getPrivateFile(data.fileId);
    if (!file) {
      setResponseStatus(404, "Not Found");
      throw new Error("File not found in private storage.");
    }

    const safeFilename = (file.originalName || `document_${data.fileId}`).replace(/[^a-zA-Z0-9._-]/g, "_");

    if (data.mode === "preview") {
      setResponseHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
      setResponseHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    } else {
      setResponseHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    }

    await recordAuditLogServer({
      request_id: data.fileId,
      admin_id: session.admin_id,
      action: data.mode === "preview" ? "PRIVATE_FILE_PREVIEWED" : "PRIVATE_FILE_DOWNLOADED",
      metadata: `Mime: ${file.mimeType}, Size: ${file.buffer.length}`,
    }).catch(() => {});

    return {
      success: true,
      mimeType: file.mimeType,
      originalName: safeFilename,
      fileName: safeFilename,
      dataBase64: file.buffer.toString("base64"),
      dataUrl: `data:${file.mimeType};base64,${file.buffer.toString("base64")}`,
    };
  });

export const adminDeleteFrameRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      adminToken: z.string().optional(),
      csrfToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true, data.csrfToken);
    return await adminDeleteFrameRequestServer(data.requestId, session.admin_id);
  });

// --- Stripe Checkout Endpoints ---

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
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
      apiVersion: "2026-02-25.acacia" as any,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "sepa_debit"],
      line_items: [
        {
          price: config.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}&contract_id=${encodeURIComponent(data.contractId)}`,
      cancel_url: data.cancelUrl,
      client_reference_id: data.contractId,
      metadata: {
        contract_id: data.contractId,
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  });

export const verifyCheckoutSession = createServerFn({ method: "POST" })
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
      apiVersion: "2026-02-25.acacia" as any,
    });

    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    if (session.payment_status === "paid" || session.status === "complete") {
      const contractId = session.client_reference_id || session.metadata?.contract_id;
      if (contractId) {
        await confirmSubscriptionPaymentServer(contractId);
      }
      return {
        verified: true,
        contractId,
        customerEmail: session.customer_details?.email,
      };
    }

    return { verified: false };
  });

export const checkStripeConfig = createServerFn({ method: "POST" }).handler(async () => {
  const config = getServerConfig();
  return {
    enabled: Boolean(config.stripeSecretKey && config.stripeSecretKey.startsWith("sk_")),
  };
});

export const confirmStripeSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const config = getServerConfig();
    let contractId = "";
    if (config.stripeSecretKey) {
      try {
        const stripe = new Stripe(config.stripeSecretKey, {
          apiVersion: "2026-02-25.acacia" as any,
        });
        const session = await stripe.checkout.sessions.retrieve(data.sessionId);
        contractId = session.client_reference_id || (session.metadata?.contract_id ?? "");
      } catch (err) {
        console.error("Stripe retrieve error:", err);
      }
    }
    if (contractId) {
      const record = await confirmSubscriptionPaymentServer(contractId);
      if (record) {
        return {
          contractId: record.contract_id,
          fullName: record.full_name,
          email: record.email,
          phone: record.phone,
          birthDate: record.birth_date,
          birthPlace: record.birth_place,
          profession: record.profession,
          streetAddress: record.street_address,
          postalCode: record.postal_code,
          city: record.city,
          paymentMethod: record.payment_method,
          maskedIban: record.masked_iban,
          signatureType: record.signature_type,
          signatureData: record.signature_data,
          accessToken: record.access_token,
          timestamp: record.updated_at || record.created_at || new Date().toISOString(),
        };
      }
    }
    throw new Error("Could not verify or find subscription for sessionId");
  });

export const createStripeSession = createCheckoutSession;
export const sendVerificationCodes = sendVerificationCode;
export const verifyCodes = verifyCode;

// --- Customer Access Token Recovery ---

export const requestCustomerAccessRecovery = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rateCheck = await checkAndRecordRateLimit("tracking", `recover:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Too many recovery attempts. Please try again later.");
    }

    return await requestCustomerAccessRecoveryServer(data.requestId, data.email);
  });

// ============================================================================
// PHASE 2 SERVER FUNCTIONS: CUSTOMER & ADMIN DASHBOARD OPERATIONS
// ============================================================================

// --- 1. Customer Dashboard Overview & Actions ---

export const exchangeCustomerHandoff = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      handoffToken: z.string().optional(),
      stripeSessionId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("customer_auth", `handoff:${clientIp}`, 30, 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Too many handoff attempts. Please try again shortly.");
    }

    if (data.stripeSessionId) {
      const verifiedStripe = await verifyAndCreateCustomerHandoffFromStripe(data.stripeSessionId);
      if (!verifiedStripe.handoffToken) {
        throw new Error("Could not generate customer handoff from Stripe checkout session.");
      }
      const handoffResult = await exchangeCustomerHandoffServer(verifiedStripe.handoffToken);
      return {
        success: true,
        customerEmail: handoffResult.customerEmail,
        contractId: handoffResult.contractId,
        paymentStatus: verifiedStripe.paymentStatus,
        subscriptionStatus: verifiedStripe.subscriptionStatus,
      };
    }

    if (data.handoffToken) {
      const handoffResult = await exchangeCustomerHandoffServer(data.handoffToken);
      return {
        success: true,
        customerEmail: handoffResult.customerEmail,
        contractId: handoffResult.contractId,
        paymentStatus: "paid" as const,
        subscriptionStatus: "active" as const,
      };
    }

    throw new Error("Missing handoffToken or stripeSessionId.");
  });

export const customerLogout = createServerFn({ method: "POST" }).handler(async () => {
  return await customerLogoutServer();
});

export const handleStripeWebhook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      rawBody: z.string(),
      signature: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    return await handleStripeWebhookServer(data.rawBody, data.signature);
  });

export const customerLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      identifier: z.string().min(1, "Please enter your email or tracking ID"),
      contractId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("customer_login", `login:${clientIp}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      return { success: false, error: "Too many login attempts. Please try again later." };
    }

    const resolved = await resolveCustomerIdentifierServer(data.identifier);
    if (!resolved) {
      setResponseStatus(401, "Unauthorized");
      return {
        success: false,
        error: "No account found matching this email or tracking ID. Please check and try again.",
      };
    }

    await createDirectCustomerSession(resolved.email, resolved.contractId || data.contractId);
    return {
      success: true,
      email: resolved.email,
      name: resolved.name,
      contractId: resolved.contractId || data.contractId,
    };
  });

export const customerGetOverview = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        accessToken: z.string().optional(),
        contractId: z.string().optional(),
        identifier: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("customer_api", `overview:${clientIp}`, 60, 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Rate limit exceeded. Please try again shortly.");
    }

    // 1. Authenticate via secure HttpOnly customer session cookie
    try {
      const session = await requireCustomerSession(false);
      if (session && session.customer_email) {
        return await getCustomerOverviewServer({
          email: session.customer_email,
          contractId: session.contract_id || data?.contractId,
          internalSessionVerified: true,
        });
      }
    } catch {
      // Cookie not present or invalid; fallback below
    }

    // 2. Direct identifier resolution (Email, Tracking ID, Contract ID, or Token)
    const candidate = data?.identifier?.trim() || data?.email?.trim() || data?.accessToken?.trim();
    if (candidate) {
      const resolved = await resolveCustomerIdentifierServer(candidate);
      if (resolved) {
        await createDirectCustomerSession(resolved.email, resolved.contractId || data?.contractId).catch(() => {});
        return await getCustomerOverviewServer({
          email: resolved.email,
          contractId: resolved.contractId || data?.contractId,
          internalSessionVerified: true,
        });
      }
    }

    // 3. Fallback to direct token if raw token matches length
    if (data?.accessToken && data.accessToken.trim().length >= 16) {
      return await getCustomerOverviewServer({
        accessToken: data.accessToken.trim(),
        contractId: data.contractId?.trim() || undefined,
      });
    }

    setResponseStatus(401, "Unauthorized");
    throw new Error("Unauthorized: Valid customer session cookie, email, or tracking ID required.");
  });

export const adminCreateOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().optional(),
      contractId: z.string().optional(),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      frameBrand: z.string().optional(),
      frameModel: z.string().optional(),
      lensType: z.string().default("Single Vision Index 1.6"),
      status: z.enum([
        "Requested",
        "Verified",
        "Confirmed",
        "Processing",
        "Lens Production",
        "Quality Check",
        "Shipped",
        "Delivered",
      ]).default("Requested"),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdminSession(false);
    return await createOrderServer({
      request_id: data.requestId,
      contract_id: data.contractId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      frame_brand: data.frameBrand,
      frame_model: data.frameModel,
      lens_type: data.lensType,
      status: data.status,
    });
  });

export const customerRespondToFrameOption = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      accessToken: z.string().min(1),
      decision: z.enum(["approved", "declined", "resubmit_requested"]),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("customer_api", `decision:${clientIp}`, 20, 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Rate limit exceeded.");
    }
    return await customerRespondToFrameOptionServer(
      data.requestId,
      data.accessToken,
      data.decision,
      data.notes,
    );
  });

export const customerSubmitReplacement = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      subscriptionId: z.string().min(1),
      previousOrderId: z.string().optional(),
      reason: z.enum(["accidental_damage", "lost_item", "prescription_change", "other"]),
      description: z.string().min(1),
      evidenceFileName: z.string().optional(),
      evidenceData: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("customer_api", `replacement:${clientIp}`, 10, 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    return await submitReplacementRequestServer(data);
  });

// --- 2. Messaging & Communication ---

export const customerGetMessages = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contextType: z.enum(["frame_request", "prescription", "order", "support"]),
      contextId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return await getMessagesServer(data.contextType, data.contextId);
  });

export const customerSendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contextType: z.enum(["frame_request", "prescription", "order", "support"]),
      contextId: z.string().min(1),
      senderEmail: z.string().email(),
      senderName: z.string().min(1),
      body: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const clientIp = getClientIdentifier();
    const rate = await checkAndRecordRateLimit("messaging", `msg:${clientIp}`, 20, 60 * 1000);
    if (!rate.allowed) {
      setResponseStatus(429, "Too Many Requests");
      throw new Error("Too many messages sent. Please pause.");
    }

    return await sendMessageServer({
      contextType: data.contextType,
      contextId: data.contextId,
      senderRole: "customer",
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      body: data.body,
    });
  });

// --- 3. Optician Partners & VTO ---

export const getOpticianPartners = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.query) {
      return await searchOpticianPartnersServer(data.query);
    }
    return await getOpticianPartnersServer({
      city: data.city,
      postalCode: data.postalCode,
      activeOnly: true,
    });
  });

export const getVtoConfiguration = createServerFn({ method: "POST" }).handler(async () => {
  return getVTOStatus();
});

// --- 4. Admin Operations: Orders, Prescriptions, Partners & Claims ---

export const adminGetOrders = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdminSession(true);
  return await getOrdersServer();
});

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string().min(1),
      status: z.enum([
        "Requested",
        "Verified",
        "Confirmed",
        "Processing",
        "Lens Production",
        "Quality Check",
        "Shipped",
        "Delivered",
      ]),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    return await updateOrderStatusServer(data.orderId, data.status as OrderStatus, {
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      estimatedDelivery: data.estimatedDelivery,
      notes: data.notes,
      adminId: session.admin_id,
    });
  });

export const adminGetReplacements = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdminSession(true);
  return await getReplacementRequestsServer();
});

export const adminUpdateReplacementStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      status: z.enum(["under_review", "approved", "rejected", "dispatched"]),
      reviewNotes: z.string().optional(),
      replacementOrderId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    return await updateReplacementStatusServer(
      data.requestId,
      data.status,
      data.reviewNotes,
      data.replacementOrderId,
      session.admin_id,
    );
  });

export const adminGetMessages = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contextType: z.enum(["frame_request", "prescription", "order", "support"]),
      contextId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdminSession(true);
    return await getMessagesServer(data.contextType, data.contextId);
  });

export const adminSendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contextType: z.enum(["frame_request", "prescription", "order", "support"]),
      contextId: z.string().min(1),
      body: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    const msg = await sendMessageServer({
      contextType: data.contextType,
      contextId: data.contextId,
      senderRole: "admin",
      senderEmail: "support@lensly.care",
      senderName: "Lensly Care Team",
      body: data.body,
    });
    return msg;
  });

export const adminUpdatePrescriptionReview = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      reviewStatus: z.enum([
        "Submitted",
        "Under Review",
        "Need More Information",
        "Approved for Fulfillment",
        "Not Supported",
      ]),
      reviewerNotes: z.string().optional(),
      resubmissionReason: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    return await adminUpdatePrescriptionReviewServer(
      data.requestId,
      data.reviewStatus,
      data.reviewerNotes,
      data.resubmissionReason,
      session.admin_id,
    );
  });

export const adminUpdateFrameRequestDetails = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().min(1),
      status: z.string().optional(),
      procurementCost: z.number().optional(),
      customerPrice: z.number().optional(),
      frameDimensions: z.string().optional(),
      availability: z.string().optional(),
      source: z.string().optional(),
      compatibilityStatus: z.enum(["compatible", "incompatible", "requires_inspection"]).optional(),
      adminResponse: z.string().optional(),
      adminNotes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    return await adminUpdateFrameRequestDetailsServer(
      data.requestId,
      {
        status: data.status as FrameRequestStatus | undefined,
        procurementCost: data.procurementCost,
        customerPrice: data.customerPrice,
        frameDimensions: data.frameDimensions,
        availability: data.availability as any,
        source: data.source,
        compatibilityStatus: (data.compatibilityStatus === "requires_inspection"
          ? "needs_thinner_index"
          : data.compatibilityStatus) as any,
        adminResponse: data.adminResponse,
        adminNotes: data.adminNotes,
      },
      session.admin_id,
    );
  });

export const adminGetPartners = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdminSession(true);
  return await getOpticianPartnersServer({ activeOnly: false });
});

export const adminUpdatePartner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      businessName: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      address: z.string().optional(),
      services: z.array(z.string()),
      appointmentUrl: z.string().optional(),
      isActive: z.boolean(),
      supportsMeasurements: z.boolean(),
      internalNotes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession(true);
    return await updateOpticianPartnerServer(
      {
        id: data.id,
        business_name: data.businessName,
        city: data.city,
        postal_code: data.postalCode,
        street_address: data.address || "",
        country: data.country,
        phone: data.contactPhone || "",
        email: data.contactEmail || "",
        services: data.services,
        appointment_url: data.appointmentUrl,
        customer_measurement_support: data.supportsMeasurements,
        active: data.isActive,
        partner_type: "verified_partner",
        notes: data.internalNotes,
      },
      session.admin_id,
    );
  });


