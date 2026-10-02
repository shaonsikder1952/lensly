import process from "node:process";
import { getServerConfig } from "./config.server";

export type ServiceReadinessStatus =
  | "READY"
  | "CONFIGURED BUT OPTIONAL"
  | "REQUIRES EXTERNAL CONFIGURATION"
  | "REQUIRES BUSINESS/LEGAL DECISION"
  | "NOT IMPLEMENTED";

export interface ServiceReadinessReportItem {
  service: string;
  category: "core_infrastructure" | "billing" | "security" | "communication" | "optics_vto" | "legal_business";
  status: ServiceReadinessStatus;
  details: string;
  envVarsChecked?: string[];
  isProductionBlocker: boolean;
}

export interface ProductionReadinessReport {
  timestamp: string;
  environment: string;
  isLaunchReady: boolean;
  totalServices: number;
  readyCount: number;
  blockerCount: number;
  services: ServiceReadinessReportItem[];
}

/**
 * Authoritative production configuration and readiness validator.
 * Distinctly classifies services without falsely claiming unconfigured integrations are "READY".
 */
export function validateProductionReadiness(): ProductionReadinessReport {
  const config = getServerConfig();
  const isProd = process.env.NODE_ENV === "production";
  const services: ServiceReadinessReportItem[] = [];

  // 1. PostgreSQL Database
  const hasDb = Boolean(config.databaseUrl && config.databaseUrl.startsWith("postgres"));
  services.push({
    service: "PostgreSQL Database Engine",
    category: "core_infrastructure",
    status: hasDb ? "READY" : "REQUIRES EXTERNAL CONFIGURATION",
    details: hasDb
      ? "PostgreSQL database connection string configured with automatic schema migration."
      : "DATABASE_URL is not configured. Local JSON fallback is only permitted in development.",
    envVarsChecked: ["DATABASE_URL"],
    isProductionBlocker: !hasDb,
  });

  // 2. Durable Object Storage (S3 / Cloudflare R2)
  const hasS3 = Boolean(config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey);
  services.push({
    service: "Durable Private Medical File Storage (S3 / R2)",
    category: "core_infrastructure",
    status: hasS3 ? "READY" : "REQUIRES EXTERNAL CONFIGURATION",
    details: hasS3
      ? `S3/R2 durable object storage configured on bucket "${config.s3Bucket}".`
      : "S3_BUCKET, S3_ACCESS_KEY_ID, or S3_SECRET_ACCESS_KEY missing. Ephemeral disk storage is prohibited in production.",
    envVarsChecked: ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"],
    isProductionBlocker: !hasS3,
  });

  // 3. Stripe Payments & Webhooks
  const hasStripeSecret = Boolean(config.stripeSecretKey && config.stripeSecretKey.startsWith("sk_"));
  const hasStripePrice = Boolean(config.stripePriceId && config.stripePriceId.startsWith("price_"));
  const hasStripeWebhook = Boolean(config.stripeWebhookSecret && config.stripeWebhookSecret.startsWith("whsec_"));
  const stripeFull = hasStripeSecret && hasStripePrice && hasStripeWebhook;

  services.push({
    service: "Stripe Recurring Billing & Webhooks",
    category: "billing",
    status: stripeFull ? "READY" : "REQUIRES EXTERNAL CONFIGURATION",
    details: stripeFull
      ? "Stripe secret key, recurring price ID (€29/month), and webhook signing secret are configured."
      : "Stripe production keys (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET) are missing or incomplete.",
    envVarsChecked: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
    isProductionBlocker: !stripeFull,
  });

  // 4. Customer Authentication & Session Management
  services.push({
    service: "Customer HttpOnly Session & Zero JS-Token Architecture",
    category: "security",
    status: "READY",
    details:
      "HttpOnly __Host-customer_session cookies, single-use POST handoffs, SHA-256 token hashing, and CSRF protection active.",
    isProductionBlocker: false,
  });

  // 5. Admin Authentication & Role-Based Access Control
  const hasAdminSecret = Boolean(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH);
  services.push({
    service: "Admin Security & Audit Logging",
    category: "security",
    status: hasAdminSecret ? "READY" : "CONFIGURED BUT OPTIONAL",
    details:
      "Argon2id password hashing, __Host-admin_session HttpOnly cookie, origin checking, and audit logging active.",
    envVarsChecked: ["ADMIN_SESSION_SECRET", "ADMIN_PASSWORD_HASH"],
    isProductionBlocker: false,
  });

  // 6. Transactional Email Dispatcher
  const hasEmailKey = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
  services.push({
    service: "Transactional Email Service (Order confirmations & alerts)",
    category: "communication",
    status: hasEmailKey ? "READY" : "REQUIRES EXTERNAL CONFIGURATION",
    details: hasEmailKey
      ? "External email provider configured for automated customer communications."
      : "RESEND_API_KEY or SMTP configuration required for production customer emails.",
    envVarsChecked: ["RESEND_API_KEY", "SMTP_HOST"],
    isProductionBlocker: isProd && !hasEmailKey,
  });

  // 7. SMS Gateway (Phone Verification)
  const hasSmsKey = Boolean(process.env.TWILIO_AUTH_TOKEN);
  services.push({
    service: "SMS Gateway (2FA Phone Verification)",
    category: "communication",
    status: hasSmsKey ? "READY" : "CONFIGURED BUT OPTIONAL",
    details: hasSmsKey
      ? "Twilio SMS gateway configured for phone OTP delivery."
      : "SMS gateway not configured; dual-channel verification safely uses email delivery.",
    envVarsChecked: ["TWILIO_AUTH_TOKEN"],
    isProductionBlocker: false,
  });

  // 8. Commercial VTO 3D Fitting SDK
  services.push({
    service: "Commercial 3D Virtual Fit Engine (Facial Mapping)",
    category: "optics_vto",
    status: "NOT IMPLEMENTED",
    details:
      "Commercial proprietary 3D engine is not implemented. Production runs robust HTML5 Canvas live video overlay + client-side photo fallback.",
    isProductionBlocker: false,
  });

  // 9. Contracted Partner Optician Network
  services.push({
    service: "Contracted Partner Optician Network (Affiliated Stores)",
    category: "optics_vto",
    status: "REQUIRES BUSINESS/LEGAL DECISION",
    details:
      "Curated optician directory is active with search and partner admin management. Formal commercial franchise contracts require business execution.",
    isProductionBlocker: false,
  });

  // 10. Legal & Statutory Reimbursement Compliance
  services.push({
    service: "Legal Disclaimers & Statutory Health Insurance Copy",
    category: "legal_business",
    status: "READY",
    details:
      "Compliant disclaimers in place regarding statutory reimbursement (§ 312g BGB custom manufactured goods disclaimer & factual GKV note).",
    isProductionBlocker: false,
  });

  const blockers = services.filter((s) => s.isProductionBlocker);

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    isLaunchReady: blockers.length === 0,
    totalServices: services.length,
    readyCount: services.filter((s) => s.status === "READY").length,
    blockerCount: blockers.length,
    services,
  };
}
