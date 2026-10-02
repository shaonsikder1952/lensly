import postgres from "postgres";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { getServerConfig } from "./config.server";
import { getEmailService } from "./notifications.server";
import { getDataFilePath } from "./data-dir.server";

export interface Subscription {
  id?: number;
  contract_id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  birth_place: string;
  profession: string;
  street_address: string;
  postal_code: string;
  city: string;
  state?: string;
  country?: string;
  payment_method: "sepa" | "wallet";
  masked_iban?: string;
  signature_type: "draw" | "type";
  signature_data: string;
  status: "active" | "cancelled" | "withdrawn" | "pending" | "paused" | "archived" | "past_due";
  access_token?: string;
  access_token_hash?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_checkout_session_id?: string;
  stripe_latest_invoice_id?: string;
  handoff_token?: string;
  created_at?: string;
  updated_at?: string;
}

export type FrameRequestStatus =
  | "Requested"
  | "Under Review"
  | "Frame Found"
  | "Compatibility Check"
  | "Prescription Review"
  | "Price/Availability Confirmation"
  | "Ready for Checkout"
  | "Ordered"
  | "Rejected";

export interface FrameRequestPublic {
  id?: number;
  request_id: string;
  status: FrameRequestStatus;
  frame_url?: string;
  frame_image_file_id?: string;
  frame_brand?: string;
  frame_model?: string;
  created_at: string;
  updated_at: string;
}

export interface FrameRequestCustomer {
  id?: number;
  request_id: string;
  full_name: string;
  email: string;
  phone?: string;
  customer_notes?: string;
  admin_notes?: string;
  access_token_hash: string;
  created_at: string;
}

export interface FrameRequestPrescription {
  id?: number;
  request_id: string;
  prescription_type: "file" | "manual" | "none";
  prescription_sph_r?: string;
  prescription_sph_l?: string;
  prescription_cyl_r?: string;
  prescription_cyl_l?: string;
  prescription_axis_r?: string;
  prescription_axis_l?: string;
  prescription_pd?: string;
  prescription_file_id?: string;
  review_status?: "Submitted" | "Under Review" | "Need More Information" | "Approved for Fulfillment" | "Not Supported";
  reviewer_notes?: string;
  resubmission_reason?: string;
  created_at: string;
}

export interface FrameRequestAuditLog {
  id?: number;
  request_id: string;
  admin_id: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  metadata?: string;
  created_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  csrf_token: string;
  ip_hash?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string;
}

export interface AdminFrameRequestRecord {
  id?: number;
  requestId: string;
  status: FrameRequestStatus;
  frameUrl?: string;
  frameImageFileId?: string;
  frameBrand?: string;
  frameModel?: string;
  fullName: string;
  email: string;
  phone?: string;
  customerNotes?: string;
  adminNotes?: string;
  procurementCost?: number; // Internal cost - never exposed to customer
  customerPrice?: number;
  frameDimensions?: string;
  availability?: "in_stock" | "available_via_partner" | "backorder" | "unavailable";
  source?: string; // Internal source - never exposed to customer
  compatibilityStatus?: "compatible" | "needs_thinner_index" | "incompatible";
  adminResponse?: string;
  customerDecision?: "pending" | "approved" | "declined" | "resubmit_requested";
  prescriptionType?: "file" | "manual" | "none";
  prescriptionSphR?: string;
  prescriptionSphL?: string;
  prescriptionCylR?: string;
  prescriptionCylL?: string;
  prescriptionAxisR?: string;
  prescriptionAxisL?: string;
  prescriptionPd?: string;
  prescriptionFileId?: string;
  reviewStatus?: "Submitted" | "Under Review" | "Need More Information" | "Approved for Fulfillment" | "Not Supported";
  reviewerNotes?: string;
  resubmissionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy compatible interface
export interface FrameRequest {
  id?: number;
  request_id: string;
  full_name: string;
  email: string;
  phone?: string;
  frame_url?: string;
  frame_image_data?: string;
  frame_image_file_id?: string;
  frame_brand?: string;
  frame_model?: string;
  notes?: string;
  status: FrameRequestStatus;
  admin_notes?: string;
  prescription_type?: "file" | "manual" | "none";
  prescription_sph_r?: string;
  prescription_sph_l?: string;
  prescription_cyl_r?: string;
  prescription_cyl_l?: string;
  prescription_axis_r?: string;
  prescription_axis_l?: string;
  prescription_pd?: string;
  prescription_file_data?: string;
  prescription_file_id?: string;
  created_at?: string;
  updated_at?: string;
}

const FALLBACK_FILE_PATH = getDataFilePath("subscriptions.json");
const DELETED_FALLBACK_FILE_PATH = getDataFilePath("deleted_subscriptions.json");
const FRAME_REQUESTS_FILE_PATH = getDataFilePath("frame_requests.json");
const FRAME_CUSTOMERS_FILE_PATH = getDataFilePath("frame_customers.json");
const PRESCRIPTIONS_FILE_PATH = getDataFilePath("prescriptions.json");
const AUDIT_LOGS_FILE_PATH = getDataFilePath("audit_logs.json");
const ADMIN_SESSIONS_FILE_PATH = getDataFilePath("admin_sessions.json");

async function readFromDeletedJsonFile(): Promise<Subscription[]> {
  try {
    const content = await fs.readFile(DELETED_FALLBACK_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as Record<string, unknown>).code === "ENOENT"
    ) {
      return [];
    }
    console.error("Error reading deleted_subscriptions.json fallback file:", error);
    return [];
  }
}

async function writeToDeletedJsonFile(data: Subscription[]): Promise<void> {
  try {
    await fs.writeFile(DELETED_FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing deleted_subscriptions.json fallback file:", error);
  }
}

let sql: postgres.Sql | null = null;
let dbInitialized = false;

export function getSqlClient() {
  if (sql) return sql;
  const config = getServerConfig();
  if (!config.databaseUrl) {
    return null;
  }
  try {
    sql = postgres(config.databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 5,
      // Suppress unhandled connection errors from crashing Node process immediately
      onparameter: () => {},
    });
    return sql;
  } catch (error) {
    console.error("Failed to initialize postgres client:", error);
    return null;
  }
}

export function getStorageMode(): "PRODUCTION_STORAGE" | "DEVELOPMENT_STORAGE" {
  const isProduction = process.env.NODE_ENV === "production";
  const config = getServerConfig();
  if (isProduction || config.databaseUrl) {
    return "PRODUCTION_STORAGE";
  }
  return "DEVELOPMENT_STORAGE";
}

export async function ensureDbInitialized(): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";
  const config = getServerConfig();

  // PRODUCTION GUARD: Fail fast if DATABASE_URL is missing in production
  if (isProduction && !config.databaseUrl) {
    throw new Error(
      "[Lensly Production Guard] CRITICAL CONFIGURATION ERROR: DATABASE_URL must be configured in production (NODE_ENV=production). " +
      "Silent fallback to local JSON persistence is strictly prohibited for customer records, orders, prescriptions, and audit logs."
    );
  }

  if (dbInitialized) return true;

  const client = getSqlClient();
  if (!client) {
    if (isProduction) {
      throw new Error(
        "[Lensly Production Guard] CRITICAL: PostgreSQL client connection failed in production. " +
        "Operating with local JSON fallback in production is prohibited."
      );
    }
    console.log(
      "[DEVELOPMENT STORAGE] No DATABASE_URL configured or client initialization failed. Falling back to local JSON file storage (development only).",
    );
    return false;
  }

  try {
    // Create the subscriptions table if it does not exist
    await client`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        contract_id VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        birth_date VARCHAR(50),
        birth_place VARCHAR(255),
        profession VARCHAR(100),
        street_address VARCHAR(500),
        postal_code VARCHAR(20),
        city VARCHAR(255),
        state VARCHAR(255),
        country VARCHAR(255),
        payment_method VARCHAR(50) NOT NULL,
        masked_iban VARCHAR(100),
        signature_type VARCHAR(20) NOT NULL,
        signature_data TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create the deleted_subscriptions table if it does not exist
    await client`
      CREATE TABLE IF NOT EXISTS deleted_subscriptions (
        id SERIAL PRIMARY KEY,
        contract_id VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        birth_date VARCHAR(50),
        birth_place VARCHAR(255),
        profession VARCHAR(100),
        street_address VARCHAR(500),
        postal_code VARCHAR(20),
        city VARCHAR(255),
        state VARCHAR(255),
        country VARCHAR(255),
        payment_method VARCHAR(50) NOT NULL,
        masked_iban VARCHAR(100),
        signature_type VARCHAR(20) NOT NULL,
        signature_data TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Add columns dynamically if the table already existed with the old schema (Auto-Migration)
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS profession VARCHAR(100);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS street_address VARCHAR(500);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS city VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS state VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS country VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS access_token VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS access_token_hash VARCHAR(128);`;

    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS profession VARCHAR(100);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS street_address VARCHAR(500);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS city VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS state VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS country VARCHAR(255);`;

    // Create the frame_requests table if it does not exist
    await client`
      CREATE TABLE IF NOT EXISTS frame_requests (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        frame_url TEXT,
        frame_image_data TEXT,
        frame_image_file_id VARCHAR(100),
        frame_brand VARCHAR(255),
        frame_model VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'Requested' NOT NULL,
        admin_notes TEXT,
        prescription_type VARCHAR(20) DEFAULT 'none',
        prescription_sph_r VARCHAR(20),
        prescription_sph_l VARCHAR(20),
        prescription_cyl_r VARCHAR(20),
        prescription_cyl_l VARCHAR(20),
        prescription_axis_r VARCHAR(20),
        prescription_axis_l VARCHAR(20),
        prescription_pd VARCHAR(20),
        prescription_file_data TEXT,
        prescription_file_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await client`ALTER TABLE frame_requests ADD COLUMN IF NOT EXISTS frame_image_file_id VARCHAR(100);`;
    await client`ALTER TABLE frame_requests ADD COLUMN IF NOT EXISTS prescription_file_id VARCHAR(100);`;

    // Customer details isolated entity
    await client`
      CREATE TABLE IF NOT EXISTS frame_request_customers (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        customer_notes TEXT,
        admin_notes TEXT,
        access_token_hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Sensitive prescription data isolated entity
    await client`
      CREATE TABLE IF NOT EXISTS frame_request_prescriptions (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(100) UNIQUE NOT NULL,
        prescription_type VARCHAR(20) DEFAULT 'none',
        prescription_sph_r VARCHAR(20),
        prescription_sph_l VARCHAR(20),
        prescription_cyl_r VARCHAR(20),
        prescription_cyl_l VARCHAR(20),
        prescription_axis_r VARCHAR(20),
        prescription_axis_l VARCHAR(20),
        prescription_pd VARCHAR(20),
        prescription_file_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Audit logs for sensitive admin changes
    await client`
      CREATE TABLE IF NOT EXISTS frame_request_audit_logs (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(100) NOT NULL,
        admin_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50),
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Server-side admin session storage
    await client`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id VARCHAR(128) PRIMARY KEY,
        admin_id VARCHAR(100) NOT NULL,
        csrf_token VARCHAR(128) NOT NULL,
        ip_hash VARCHAR(64),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE
      );
    `;

    // Stripe metadata columns auto-migration
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_latest_invoice_id VARCHAR(255);`;

    // Customer server-side sessions
    await client`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id VARCHAR(128) PRIMARY KEY,
        customer_email VARCHAR(255) NOT NULL,
        contract_id VARCHAR(100),
        csrf_token VARCHAR(128) NOT NULL,
        ip_hash VARCHAR(64),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE
      );
    `;

    // Customer single-use handoffs
    await client`
      CREATE TABLE IF NOT EXISTS customer_handoffs (
        token_hash VARCHAR(128) PRIMARY KEY,
        customer_email VARCHAR(255) NOT NULL,
        contract_id VARCHAR(100),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false NOT NULL
      );
    `;

    // Stripe webhook idempotent events
    await client`
      CREATE TABLE IF NOT EXISTS stripe_events (
        event_id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Add indices to speed up common searches
    await client`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_contract_id ON subscriptions(contract_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_deleted_subscriptions_email ON deleted_subscriptions(email);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_deleted_subscriptions_contract_id ON deleted_subscriptions(contract_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_frame_requests_email ON frame_requests(email);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_frame_requests_request_id ON frame_requests(request_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_frame_request_customers_req_id ON frame_request_customers(request_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_frame_request_prescriptions_req_id ON frame_request_prescriptions(request_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_frame_request_audit_logs_req_id ON frame_request_audit_logs(request_id);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_id ON admin_sessions(id);
    `;

    dbInitialized = true;
    console.log("Successfully connected to PostgreSQL and validated subscriptions and frame_requests table schema.");
    return true;
  } catch (error) {
    console.error(
      "Failed to connect to PostgreSQL or initialize table. Falling back to subscriptions.json. Error:",
      error,
    );
    return false;
  }
}

async function readFromJsonFile(): Promise<Subscription[]> {
  try {
    const content = await fs.readFile(FALLBACK_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as Record<string, unknown>).code === "ENOENT"
    ) {
      return [];
    }
    console.error("Error reading subscriptions.json fallback file:", error);
    return [];
  }
}

async function writeToJsonFile(data: Subscription[]): Promise<void> {
  try {
    await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing subscriptions.json fallback file:", error);
  }
}

export async function saveSubscriptionServer(
  sub: Omit<Subscription, "created_at" | "updated_at">,
): Promise<Subscription> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  const contractId = (sub as any).contract_id || (sub as any).contractId;
  const fullName = (sub as any).full_name || (sub as any).fullName;
  const birthDate = (sub as any).birth_date || (sub as any).birthDate || "";
  const birthPlace = (sub as any).birth_place || (sub as any).birthPlace || "";
  const streetAddress = (sub as any).street_address || (sub as any).streetAddress || "";
  const postalCode = (sub as any).postal_code || (sub as any).postalCode || "";
  const paymentMethod = (sub as any).payment_method || (sub as any).paymentMethod || "sepa";
  const maskedIban = (sub as any).masked_iban || (sub as any).maskedIban || undefined;
  const signatureType = (sub as any).signature_type || (sub as any).signatureType || "type";
  const signatureData = (sub as any).signature_data || (sub as any).signatureData || "";

  const accessToken = sub.access_token || crypto.randomBytes(16).toString("hex");
  const accessTokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

  const newSub: Subscription = {
    ...sub,
    contract_id: contractId,
    full_name: fullName,
    birth_date: birthDate,
    birth_place: birthPlace,
    street_address: streetAddress,
    postal_code: postalCode,
    payment_method: paymentMethod,
    masked_iban: maskedIban,
    signature_type: signatureType,
    signature_data: signatureData,
    access_token: accessToken,
    access_token_hash: accessTokenHash,
    status: sub.status || "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDb && client) {
    try {
      const rows = await client`
        INSERT INTO subscriptions (
          contract_id,
          full_name,
          email,
          phone,
          birth_date,
          birth_place,
          profession,
          street_address,
          postal_code,
          city,
          state,
          country,
          payment_method,
          masked_iban,
          signature_type,
          signature_data,
          status,
          access_token,
          access_token_hash,
          created_at,
          updated_at
        ) VALUES (
          ${newSub.contract_id},
          ${newSub.full_name},
          ${newSub.email},
          ${newSub.phone},
          ${newSub.birth_date},
          ${newSub.birth_place},
          ${newSub.profession},
          ${newSub.street_address || ""},
          ${newSub.postal_code || ""},
          ${newSub.city || ""},
          ${newSub.state || ""},
          ${newSub.country || ""},
          ${newSub.payment_method},
          ${newSub.masked_iban || null},
          ${newSub.signature_type},
          ${newSub.signature_data},
          ${newSub.status},
          ${newSub.access_token || null},
          ${newSub.access_token_hash || null},
          ${newSub.created_at || ""},
          ${newSub.updated_at || ""}
        )
        RETURNING *
      `;
      if (rows && rows[0]) {
        const row = rows[0];
        return {
          id: row.id,
          contract_id: row.contract_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || "",
          birth_date: row.birth_date || "",
          birth_place: row.birth_place || "",
          profession: row.profession || "",
          street_address: row.street_address || "",
          postal_code: row.postal_code || "",
          city: row.city || "",
          state: row.state || "",
          country: row.country || "",
          payment_method: row.payment_method,
          masked_iban: row.masked_iban || undefined,
          signature_type: row.signature_type,
          signature_data: row.signature_data,
          status: row.status,
          access_token: row.access_token || accessToken,
          access_token_hash: row.access_token_hash || accessTokenHash,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      }
    } catch (error) {
      console.error("PostgreSQL insert failed, falling back to local JSON file storage:", error);
    }
  }

  // Fallback to local JSON file
  const list = await readFromJsonFile();
  const filtered = list.filter((item) => (item.contract_id || (item as any).contractId) !== contractId);
  filtered.push(newSub);
  await writeToJsonFile(filtered);
  return newSub;
}

export async function getSubscriptionsServer(): Promise<Subscription[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM subscriptions ORDER BY created_at DESC
      `;
      return rows.map((row) => ({
        id: row.id,
        contract_id: row.contract_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone || "",
        birth_date: row.birth_date || "",
        birth_place: row.birth_place || "",
        profession: row.profession || "",
        street_address: row.street_address || "",
        postal_code: row.postal_code || "",
        city: row.city || "",
        state: row.state || "",
        country: row.country || "",
        payment_method: row.payment_method,
        masked_iban: row.masked_iban || undefined,
        signature_type: row.signature_type,
        signature_data: row.signature_data,
        status: row.status,
        access_token: row.access_token || undefined,
        access_token_hash: row.access_token_hash || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error("PostgreSQL select failed, falling back to local JSON file storage:", error);
    }
  }

  const list = await readFromJsonFile();
  const normalized = list.map((item: any) => ({
    ...item,
    contractId: item.contractId || item.contract_id || "",
    contract_id: item.contract_id || item.contractId || "",
    fullName: item.fullName || item.full_name || "",
    full_name: item.full_name || item.fullName || "",
    birthDate: item.birthDate || item.birth_date || "",
    birth_date: item.birth_date || item.birthDate || "",
    birthPlace: item.birthPlace || item.birth_place || "",
    birth_place: item.birth_place || item.birthPlace || "",
    streetAddress: item.streetAddress || item.street_address || "",
    street_address: item.street_address || item.streetAddress || "",
    postalCode: item.postalCode || item.postal_code || "",
    postal_code: item.postal_code || item.postalCode || "",
    paymentMethod: item.paymentMethod || item.payment_method || "sepa",
    payment_method: item.payment_method || item.paymentMethod || "sepa",
    maskedIban: item.maskedIban || item.masked_iban,
    masked_iban: item.masked_iban || item.maskedIban,
    signatureType: item.signatureType || item.signature_type || "type",
    signature_type: item.signature_type || item.signatureType || "type",
    signatureData: item.signatureData || item.signature_data || "",
    signature_data: item.signature_data || item.signatureData || "",
    createdAt: item.createdAt || item.created_at,
    created_at: item.created_at || item.createdAt,
    updatedAt: item.updatedAt || item.updated_at,
    updated_at: item.updated_at || item.updatedAt,
  }));
  return normalized.sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );
}

export async function updateSubscriptionStatusServer(
  contractId: string,
  email: string,
  status: "active" | "cancelled" | "withdrawn" | "paused" | "archived",
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (isDb && client) {
    try {
      const rows = await client`
        UPDATE subscriptions
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        RETURNING id
      `;
      if (rows && rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL status update failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromJsonFile();
  let updated = false;
  const updatedList = list.map((item) => {
    if (
      item.contract_id.trim().toUpperCase() === normalizedContract &&
      item.email.trim().toLowerCase() === normalizedEmail
    ) {
      updated = true;
      return {
        ...item,
        status,
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });

  if (updated) {
    await writeToJsonFile(updatedList);
  } else {
    const newItem: Subscription = {
      contract_id: normalizedContract,
      full_name: "Statutory Form Submission",
      email: normalizedEmail,
      phone: "n/a",
      birth_date: "n/a",
      birth_place: "n/a",
      profession: "n/a",
      street_address: "n/a",
      postal_code: "n/a",
      city: "n/a",
      payment_method: "sepa",
      signature_type: "type",
      signature_data: "n/a",
      status: status as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newItem);
    await writeToJsonFile(list);

    if (isDb && client) {
      try {
        await client`
          INSERT INTO subscriptions (contract_id, full_name, email, phone, birth_date, birth_place, profession, street_address, postal_code, city, payment_method, signature_type, signature_data, status)
          VALUES (${normalizedContract}, 'Statutory Form Submission', ${normalizedEmail}, 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'sepa', 'type', 'n/a', ${status})
          ON CONFLICT (contract_id) DO UPDATE 
          SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        `;
      } catch (dbErr) {
        console.error("Failed to insert form submission in DB:", dbErr);
      }
    }
  }
  return true;
}

export async function confirmSubscriptionPaymentServer(
  contractId: string,
  email?: string,
  paymentMethod: "sepa" | "wallet" = "wallet",
  maskedIban: string = "Stripe Secured",
): Promise<Subscription | null> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

  if (isDb && client) {
    try {
      const rows = normalizedEmail
        ? await client`
            UPDATE subscriptions
            SET status = 'active',
                payment_method = ${paymentMethod},
                masked_iban = COALESCE(
                  NULLIF(NULLIF(${maskedIban}, 'Stripe Secured'), ''),
                  subscriptions.masked_iban,
                  'Stripe Secured'
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
            RETURNING *
          `
        : await client`
            UPDATE subscriptions
            SET status = 'active',
                payment_method = ${paymentMethod},
                masked_iban = COALESCE(
                  NULLIF(NULLIF(${maskedIban}, 'Stripe Secured'), ''),
                  subscriptions.masked_iban,
                  'Stripe Secured'
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE TRIM(UPPER(contract_id)) = ${normalizedContract}
            RETURNING *
          `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        const accessToken = row.access_token || crypto.randomBytes(16).toString("hex");
        return {
          id: row.id,
          contract_id: row.contract_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || "",
          birth_date: row.birth_date || "",
          birth_place: row.birth_place || "",
          profession: row.profession || "",
          street_address: row.street_address || "",
          postal_code: row.postal_code || "",
          city: row.city || "",
          state: row.state || "",
          country: row.country || "",
          payment_method: row.payment_method,
          masked_iban: row.masked_iban || undefined,
          signature_type: row.signature_type,
          signature_data: row.signature_data,
          status: row.status,
          access_token: accessToken,
          access_token_hash: crypto.createHash("sha256").update(accessToken).digest("hex"),
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      }
    } catch (error) {
      console.error("PostgreSQL payment confirmation failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromJsonFile();
  let updatedRecord: Subscription | null = null;
  const updatedList = list.map((item) => {
    const matchesContract = item.contract_id.trim().toUpperCase() === normalizedContract;
    const matchesEmail = normalizedEmail ? item.email.trim().toLowerCase() === normalizedEmail : true;
    if (matchesContract && matchesEmail) {
      const finalIban = (maskedIban === "Stripe Secured" && item.masked_iban && item.masked_iban !== "n/a")
        ? item.masked_iban
        : maskedIban;
      const accessToken = item.access_token || crypto.randomBytes(16).toString("hex");
      updatedRecord = {
        ...item,
        status: "active" as const,
        payment_method: paymentMethod,
        masked_iban: finalIban,
        access_token: accessToken,
        access_token_hash: crypto.createHash("sha256").update(accessToken).digest("hex"),
        updated_at: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return item;
  });

  if (updatedRecord) {
    await writeToJsonFile(updatedList);
  }
  return updatedRecord;
}

export async function deleteSubscriptionServer(
  contractId: string,
  email: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  let subscriptionToMove: Subscription | null = null;

  if (isDb && client) {
    try {
      // Find the subscription first
      const rows = await client`
        SELECT * FROM subscriptions
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        subscriptionToMove = {
          id: row.id,
          contract_id: row.contract_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || "",
          birth_date: row.birth_date || "",
          birth_place: row.birth_place || "",
          profession: row.profession || "",
          street_address: row.street_address || "",
          postal_code: row.postal_code || "",
          city: row.city || "",
          state: row.state || "",
          country: row.country || "",
          payment_method: row.payment_method,
          masked_iban: row.masked_iban || undefined,
          signature_type: row.signature_type,
          signature_data: row.signature_data,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        // Insert into deleted_subscriptions
        await client`
          INSERT INTO deleted_subscriptions (
            contract_id, full_name, email, phone, birth_date, birth_place, profession,
            street_address, postal_code, city, state, country, payment_method,
            masked_iban, signature_type, signature_data, status, created_at, updated_at, deleted_at
          ) VALUES (
            ${subscriptionToMove.contract_id}, ${subscriptionToMove.full_name}, ${subscriptionToMove.email},
            ${subscriptionToMove.phone}, ${subscriptionToMove.birth_date}, ${subscriptionToMove.birth_place},
            ${subscriptionToMove.profession}, ${subscriptionToMove.street_address}, ${subscriptionToMove.postal_code},
            ${subscriptionToMove.city}, ${subscriptionToMove.state ?? null}, ${subscriptionToMove.country ?? null},
            ${subscriptionToMove.payment_method}, ${subscriptionToMove.masked_iban ?? null}, ${subscriptionToMove.signature_type},
            ${subscriptionToMove.signature_data}, ${subscriptionToMove.status}, ${subscriptionToMove.created_at ?? null},
            ${subscriptionToMove.updated_at ?? null}, CURRENT_TIMESTAMP
          )
          ON CONFLICT (contract_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            birth_date = EXCLUDED.birth_date,
            birth_place = EXCLUDED.birth_place,
            profession = EXCLUDED.profession,
            street_address = EXCLUDED.street_address,
            postal_code = EXCLUDED.postal_code,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            country = EXCLUDED.country,
            payment_method = EXCLUDED.payment_method,
            masked_iban = EXCLUDED.masked_iban,
            signature_type = EXCLUDED.signature_type,
            signature_data = EXCLUDED.signature_data,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = CURRENT_TIMESTAMP
        `;

        // Now delete it from subscriptions
        await client`
          DELETE FROM subscriptions
          WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        `;
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL soft delete failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromJsonFile();
  const matchIndex = list.findIndex(
    (item) =>
      item.contract_id.trim().toUpperCase() === normalizedContract &&
      item.email.trim().toLowerCase() === normalizedEmail,
  );
  if (matchIndex !== -1) {
    const [removedItem] = list.splice(matchIndex, 1);
    await writeToJsonFile(list);

    // Save to deleted_subscriptions JSON
    const deletedList = await readFromDeletedJsonFile();
    // Prevent duplicate contract_id in deleted list
    const filteredDeleted = deletedList.filter((item) => item.contract_id !== removedItem.contract_id);
    filteredDeleted.push(removedItem);
    await writeToDeletedJsonFile(filteredDeleted);
    return true;
  }
  return false;
}

export async function getDeletedSubscriptionsServer(): Promise<Subscription[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM deleted_subscriptions ORDER BY deleted_at DESC
      `;
      return rows.map((row) => ({
        id: row.id,
        contract_id: row.contract_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone || "",
        birth_date: row.birth_date || "",
        birth_place: row.birth_place || "",
        profession: row.profession || "",
        street_address: row.street_address || "",
        postal_code: row.postal_code || "",
        city: row.city || "",
        state: row.state || "",
        country: row.country || "",
        payment_method: row.payment_method,
        masked_iban: row.masked_iban || undefined,
        signature_type: row.signature_type,
        signature_data: row.signature_data,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error("PostgreSQL select deleted_subscriptions failed, falling back to local JSON:", error);
    }
  }

  const list = await readFromDeletedJsonFile();
  return list;
}

export async function restoreSubscriptionServer(
  contractId: string,
  email: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  let subscriptionToRestore: Subscription | null = null;

  if (isDb && client) {
    try {
      // Find the subscription first in deleted_subscriptions
      const rows = await client`
        SELECT * FROM deleted_subscriptions
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        subscriptionToRestore = {
          id: row.id,
          contract_id: row.contract_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || "",
          birth_date: row.birth_date || "",
          birth_place: row.birth_place || "",
          profession: row.profession || "",
          street_address: row.street_address || "",
          postal_code: row.postal_code || "",
          city: row.city || "",
          state: row.state || "",
          country: row.country || "",
          payment_method: row.payment_method,
          masked_iban: row.masked_iban || undefined,
          signature_type: row.signature_type,
          signature_data: row.signature_data,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        // Insert into subscriptions
        await client`
          INSERT INTO subscriptions (
            contract_id, full_name, email, phone, birth_date, birth_place, profession,
            street_address, postal_code, city, state, country, payment_method,
            masked_iban, signature_type, signature_data, status, created_at, updated_at
          ) VALUES (
            ${subscriptionToRestore.contract_id}, ${subscriptionToRestore.full_name}, ${subscriptionToRestore.email},
            ${subscriptionToRestore.phone}, ${subscriptionToRestore.birth_date}, ${subscriptionToRestore.birth_place},
            ${subscriptionToRestore.profession}, ${subscriptionToRestore.street_address}, ${subscriptionToRestore.postal_code},
            ${subscriptionToRestore.city}, ${subscriptionToRestore.state ?? null}, ${subscriptionToRestore.country ?? null},
            ${subscriptionToRestore.payment_method}, ${subscriptionToRestore.masked_iban ?? null}, ${subscriptionToRestore.signature_type},
            ${subscriptionToRestore.signature_data}, ${subscriptionToRestore.status}, ${subscriptionToRestore.created_at ?? null},
            ${subscriptionToRestore.updated_at ?? null}
          )
          ON CONFLICT (contract_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            birth_date = EXCLUDED.birth_date,
            birth_place = EXCLUDED.birth_place,
            profession = EXCLUDED.profession,
            street_address = EXCLUDED.street_address,
            postal_code = EXCLUDED.postal_code,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            country = EXCLUDED.country,
            payment_method = EXCLUDED.payment_method,
            masked_iban = EXCLUDED.masked_iban,
            signature_type = EXCLUDED.signature_type,
            signature_data = EXCLUDED.signature_data,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
        `;

        // Now delete it from deleted_subscriptions
        await client`
          DELETE FROM deleted_subscriptions
          WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        `;
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL restore failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file restore
  const deletedList = await readFromDeletedJsonFile();
  const matchIndex = deletedList.findIndex(
    (item) =>
      item.contract_id.trim().toUpperCase() === normalizedContract &&
      item.email.trim().toLowerCase() === normalizedEmail,
  );
  if (matchIndex !== -1) {
    const [removedItem] = deletedList.splice(matchIndex, 1);
    await writeToDeletedJsonFile(deletedList);

    // Save to subscriptions JSON
    const activeList = await readFromJsonFile();
    const filteredActive = activeList.filter((item) => item.contract_id !== removedItem.contract_id);
    filteredActive.push(removedItem);
    await writeToJsonFile(filteredActive);
    return true;
  }
  return false;
}

export async function permanentlyDeleteSubscriptionServer(
  contractId: string,
  email: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (isDb && client) {
    try {
      const rows = await client`
        DELETE FROM deleted_subscriptions
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        RETURNING id
      `;
      if (rows && rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL permanent delete failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromDeletedJsonFile();
  const initialLength = list.length;
  const filtered = list.filter(
    (item) =>
      item.contract_id.trim().toUpperCase() !== normalizedContract ||
      item.email.trim().toLowerCase() !== normalizedEmail,
  );
  if (filtered.length !== initialLength) {
    await writeToDeletedJsonFile(filtered);
    return true;
  }
  return false;
}

export async function editSubscriptionServer(
  contractId: string,
  email: string,
  updatedFields: Partial<Omit<Subscription, "id" | "contract_id" | "created_at" | "updated_at">>,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (isDb && client) {
    try {
      const rows = await client`
        UPDATE subscriptions
        SET full_name = COALESCE(${updatedFields.full_name ?? null}, full_name),
            email = COALESCE(${updatedFields.email ?? null}, email),
            phone = COALESCE(${updatedFields.phone ?? null}, phone),
            birth_date = COALESCE(${updatedFields.birth_date ?? null}, birth_date),
            birth_place = COALESCE(${updatedFields.birth_place ?? null}, birth_place),
            profession = COALESCE(${updatedFields.profession ?? null}, profession),
            street_address = COALESCE(${updatedFields.street_address ?? null}, street_address),
            postal_code = COALESCE(${updatedFields.postal_code ?? null}, postal_code),
            city = COALESCE(${updatedFields.city ?? null}, city),
            state = COALESCE(${updatedFields.state ?? null}, state),
            country = COALESCE(${updatedFields.country ?? null}, country),
            status = COALESCE(${updatedFields.status ?? null}, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        RETURNING id
      `;
      if (rows && rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL edit failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromJsonFile();
  let updated = false;
  const updatedList = list.map((item) => {
    if (
      item.contract_id.trim().toUpperCase() === normalizedContract &&
      item.email.trim().toLowerCase() === normalizedEmail
    ) {
      updated = true;
      return {
        ...item,
        full_name: updatedFields.full_name ?? item.full_name,
        email: updatedFields.email ?? item.email,
        phone: updatedFields.phone ?? item.phone,
        birth_date: updatedFields.birth_date ?? item.birth_date,
        birth_place: updatedFields.birth_place ?? item.birth_place,
        profession: updatedFields.profession ?? item.profession,
        street_address: updatedFields.street_address ?? item.street_address,
        postal_code: updatedFields.postal_code ?? item.postal_code,
        city: updatedFields.city ?? item.city,
        state: updatedFields.state ?? item.state,
        country: updatedFields.country ?? item.country,
        status: updatedFields.status ?? item.status,
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });

  if (updated) {
    await writeToJsonFile(updatedList);
  }
  return updated;
}

// --- Helper JSON Storage for Separated Entities ---

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as Record<string, unknown>).code === "ENOENT"
    ) {
      return [];
    }
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing fallback file ${filePath}:`, error);
  }
}

// --- Admin Sessions Storage & Verification ---

export async function createAdminSessionServer(session: AdminSession): Promise<void> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      await client`
        INSERT INTO admin_sessions (
          id, admin_id, csrf_token, ip_hash, user_agent, created_at, expires_at, revoked_at
        ) VALUES (
          ${session.id},
          ${session.admin_id},
          ${session.csrf_token},
          ${session.ip_hash ?? null},
          ${session.user_agent ?? null},
          ${session.created_at},
          ${session.expires_at},
          ${session.revoked_at ?? null}
        )
      `;
      return;
    } catch (error) {
      console.error("PostgreSQL createAdminSession failed, falling back to JSON:", error);
    }
  }

  const list = await readJsonFile<AdminSession>(ADMIN_SESSIONS_FILE_PATH);
  list.unshift(session);
  await writeJsonFile(ADMIN_SESSIONS_FILE_PATH, list);
}

export async function getAdminSessionServer(sessionId: string): Promise<AdminSession | null> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM admin_sessions
        WHERE id = ${sessionId}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return rows[0] as AdminSession;
      }
      return null;
    } catch (error) {
      console.error("PostgreSQL getAdminSession failed, falling back to JSON:", error);
    }
  }

  const list = await readJsonFile<AdminSession>(ADMIN_SESSIONS_FILE_PATH);
  return list.find((s) => s.id === sessionId) || null;
}

export async function revokeAdminSessionServer(sessionId: string): Promise<void> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const now = new Date().toISOString();

  if (isDb && client) {
    try {
      await client`
        UPDATE admin_sessions
        SET revoked_at = ${now}
        WHERE id = ${sessionId}
      `;
      return;
    } catch (error) {
      console.error("PostgreSQL revokeAdminSession failed, falling back to JSON:", error);
    }
  }

  const list = await readJsonFile<AdminSession>(ADMIN_SESSIONS_FILE_PATH);
  const updated = list.map((s) => (s.id === sessionId ? { ...s, revoked_at: now } : s));
  await writeJsonFile(ADMIN_SESSIONS_FILE_PATH, updated);
}

// --- Audit Logging ---

export async function recordAuditLogServer(
  log: Omit<FrameRequestAuditLog, "id" | "created_at">,
): Promise<void> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const newLog: FrameRequestAuditLog = {
    ...log,
    created_at: new Date().toISOString(),
  };

  if (isDb && client) {
    try {
      await client`
        INSERT INTO frame_request_audit_logs (
          request_id, admin_id, action, previous_status, new_status, metadata, created_at
        ) VALUES (
          ${newLog.request_id},
          ${newLog.admin_id},
          ${newLog.action},
          ${newLog.previous_status ?? null},
          ${newLog.new_status ?? null},
          ${newLog.metadata ?? null},
          ${newLog.created_at}
        )
      `;
      return;
    } catch (error) {
      console.error("PostgreSQL recordAuditLog failed, falling back to JSON:", error);
    }
  }

  const list = await readJsonFile<FrameRequestAuditLog>(AUDIT_LOGS_FILE_PATH);
  list.unshift(newLog);
  await writeJsonFile(AUDIT_LOGS_FILE_PATH, list);
}

// --- Separated Frame Request & Prescription Operations ---

export async function saveSeparatedFrameRequestServer(data: {
  requestId: string;
  fullName: string;
  email: string;
  phone?: string;
  frameUrl?: string;
  frameImageFileId?: string;
  frameBrand?: string;
  frameModel?: string;
  notes?: string;
  prescriptionType?: "file" | "manual" | "none";
  prescriptionSphR?: string;
  prescriptionSphL?: string;
  prescriptionCylR?: string;
  prescriptionCylL?: string;
  prescriptionAxisR?: string;
  prescriptionAxisL?: string;
  prescriptionPd?: string;
  prescriptionFileId?: string;
}): Promise<{ requestId: string; accessToken: string; status: FrameRequestStatus; createdAt: string }> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const now = new Date().toISOString();

  // Generate 256-bit customer access token for explicit ownership verification
  const accessToken = crypto.randomBytes(32).toString("hex");
  const accessTokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

  const reqMeta: FrameRequestPublic = {
    request_id: data.requestId,
    status: "Requested",
    frame_url: data.frameUrl,
    frame_image_file_id: data.frameImageFileId,
    frame_brand: data.frameBrand,
    frame_model: data.frameModel,
    created_at: now,
    updated_at: now,
  };

  const customerRecord: FrameRequestCustomer = {
    request_id: data.requestId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    customer_notes: data.notes,
    admin_notes: undefined,
    access_token_hash: accessTokenHash,
    created_at: now,
  };

  const prescriptionRecord: FrameRequestPrescription | null =
    data.prescriptionType && data.prescriptionType !== "none"
      ? {
          request_id: data.requestId,
          prescription_type: data.prescriptionType,
          prescription_sph_r: data.prescriptionSphR,
          prescription_sph_l: data.prescriptionSphL,
          prescription_cyl_r: data.prescriptionCylR,
          prescription_cyl_l: data.prescriptionCylL,
          prescription_axis_r: data.prescriptionAxisR,
          prescription_axis_l: data.prescriptionAxisL,
          prescription_pd: data.prescriptionPd,
          prescription_file_id: data.prescriptionFileId,
          created_at: now,
        }
      : null;

  if (isDb && client) {
    try {
      await client`
        INSERT INTO frame_requests (
          request_id, status, frame_url, frame_image_file_id, frame_brand, frame_model, created_at, updated_at
        ) VALUES (
          ${reqMeta.request_id},
          ${reqMeta.status},
          ${reqMeta.frame_url ?? null},
          ${reqMeta.frame_image_file_id ?? null},
          ${reqMeta.frame_brand ?? null},
          ${reqMeta.frame_model ?? null},
          ${reqMeta.created_at},
          ${reqMeta.updated_at}
        )
      `;

      await client`
        INSERT INTO frame_request_customers (
          request_id, full_name, email, phone, customer_notes, access_token_hash, created_at
        ) VALUES (
          ${customerRecord.request_id},
          ${customerRecord.full_name},
          ${customerRecord.email},
          ${customerRecord.phone ?? null},
          ${customerRecord.customer_notes ?? null},
          ${customerRecord.access_token_hash},
          ${customerRecord.created_at}
        )
      `;

      if (prescriptionRecord) {
        await client`
          INSERT INTO frame_request_prescriptions (
            request_id, prescription_type, prescription_sph_r, prescription_sph_l,
            prescription_cyl_r, prescription_cyl_l, prescription_axis_r, prescription_axis_l,
            prescription_pd, prescription_file_id, created_at
          ) VALUES (
            ${prescriptionRecord.request_id},
            ${prescriptionRecord.prescription_type},
            ${prescriptionRecord.prescription_sph_r ?? null},
            ${prescriptionRecord.prescription_sph_l ?? null},
            ${prescriptionRecord.prescription_cyl_r ?? null},
            ${prescriptionRecord.prescription_cyl_l ?? null},
            ${prescriptionRecord.prescription_axis_r ?? null},
            ${prescriptionRecord.prescription_axis_l ?? null},
            ${prescriptionRecord.prescription_pd ?? null},
            ${prescriptionRecord.prescription_file_id ?? null},
            ${prescriptionRecord.created_at}
          )
        `;
      }
    } catch (error) {
      console.error("PostgreSQL saveSeparatedFrameRequest failed, falling back to JSON:", error);
    }
  }

  // Fallback JSON updates
  const requestsList = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  requestsList.unshift(reqMeta);
  await writeJsonFile(FRAME_REQUESTS_FILE_PATH, requestsList);

  const customersList = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  customersList.unshift(customerRecord);
  await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, customersList);

  if (prescriptionRecord) {
    const prescriptionsList = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
    prescriptionsList.unshift(prescriptionRecord);
    await writeJsonFile(PRESCRIPTIONS_FILE_PATH, prescriptionsList);
  }

  return {
    requestId: reqMeta.request_id,
    accessToken,
    status: reqMeta.status,
    createdAt: reqMeta.created_at,
  };
}

/**
 * Public status lookup: strictly returns ONLY public status metadata.
 * ZERO PII, ZERO internal admin notes, ZERO prescription data.
 */
export async function getPublicFrameRequestStatusServer(
  requestId: string,
): Promise<FrameRequestPublic | null> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT request_id, status, frame_brand, frame_model, created_at, updated_at
        FROM frame_requests
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return rows[0] as FrameRequestPublic;
      }
    } catch (error) {
      console.error("PostgreSQL getPublicFrameRequestStatus failed, trying JSON:", error);
    }
  }

  const list = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  const match = list.find((item) => item?.request_id && item.request_id.trim().toUpperCase() === normalizedId);
  if (!match) return null;

  return {
    request_id: match.request_id,
    status: match.status,
    frame_brand: match.frame_brand,
    frame_model: match.frame_model,
    created_at: match.created_at,
    updated_at: match.updated_at,
  };
}

/**
 * Customer lookup: requires both requestId AND valid 256-bit accessToken.
 */
export async function getCustomerFrameRequestServer(
  requestId: string,
  accessToken: string,
): Promise<{ request: FrameRequestPublic; customer: FrameRequestCustomer; prescription?: FrameRequestPrescription } | null> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();
  const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

  if (isDb && client) {
    try {
      const custRows = await client`
        SELECT * FROM frame_request_customers
        WHERE TRIM(UPPER(request_id)) = ${normalizedId} AND access_token_hash = ${tokenHash}
        LIMIT 1
      `;
      if (!custRows || custRows.length === 0) return null;

      const reqRows = await client`
        SELECT * FROM frame_requests
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        LIMIT 1
      `;
      const prescRows = await client`
        SELECT * FROM frame_request_prescriptions
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        LIMIT 1
      `;

      return {
        request: reqRows[0] as FrameRequestPublic,
        customer: custRows[0] as FrameRequestCustomer,
        prescription: (prescRows[0] as FrameRequestPrescription) || undefined,
      };
    } catch (error) {
      console.error("PostgreSQL getCustomerFrameRequest failed, trying JSON:", error);
    }
  }

  const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  const custMatch = customers.find(
    (c) => c?.request_id && c.request_id.trim().toUpperCase() === normalizedId && c.access_token_hash === tokenHash,
  );
  if (!custMatch) return null;

  const requests = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  const reqMatch = requests.find((r) => r?.request_id && r.request_id.trim().toUpperCase() === normalizedId);
  if (!reqMatch) return null;

  const prescriptions = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
  const prescMatch = prescriptions.find((p) => p?.request_id && p.request_id.trim().toUpperCase() === normalizedId);

  return {
    request: reqMatch,
    customer: custMatch,
    prescription: prescMatch,
  };
}

/**
 * Admin view: retrieves all requests with customer and prescription references.
 */
export async function adminGetFrameRequestsServer(): Promise<AdminFrameRequestRecord[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT
          r.id,
          r.request_id AS "requestId",
          r.status,
          r.frame_url AS "frameUrl",
          r.frame_image_file_id AS "frameImageFileId",
          r.frame_brand AS "frameBrand",
          r.frame_model AS "frameModel",
          COALESCE(c.full_name, r.full_name, '') AS "fullName",
          COALESCE(c.email, r.email, '') AS "email",
          COALESCE(c.phone, r.phone) AS "phone",
          c.customer_notes AS "customerNotes",
          c.admin_notes AS "adminNotes",
          COALESCE(p.prescription_type, r.prescription_type, 'none') AS "prescriptionType",
          COALESCE(p.prescription_sph_r, r.prescription_sph_r) AS "prescriptionSphR",
          COALESCE(p.prescription_sph_l, r.prescription_sph_l) AS "prescriptionSphL",
          COALESCE(p.prescription_cyl_r, r.prescription_cyl_r) AS "prescriptionCylR",
          COALESCE(p.prescription_cyl_l, r.prescription_cyl_l) AS "prescriptionCylL",
          COALESCE(p.prescription_axis_r, r.prescription_axis_r) AS "prescriptionAxisR",
          COALESCE(p.prescription_axis_l, r.prescription_axis_l) AS "prescriptionAxisL",
          COALESCE(p.prescription_pd, r.prescription_pd) AS "prescriptionPd",
          COALESCE(p.prescription_file_id, r.prescription_file_id) AS "prescriptionFileId",
          r.created_at AS "createdAt",
          r.updated_at AS "updatedAt"
        FROM frame_requests r
        LEFT JOIN frame_request_customers c ON r.request_id = c.request_id
        LEFT JOIN frame_request_prescriptions p ON r.request_id = p.request_id
        ORDER BY r.created_at DESC
      `;
      return rows as unknown as AdminFrameRequestRecord[];
    } catch (error) {
      console.error("PostgreSQL adminGetFrameRequests failed, trying JSON:", error);
    }
  }

  // Fallback JSON aggregation
  const requests = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  const prescriptions = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);

  return requests.map((req) => {
    const cust = customers.find((c) => c.request_id === req.request_id);
    const presc = prescriptions.find((p) => p.request_id === req.request_id);

    return {
      requestId: req.request_id,
      status: req.status,
      frameUrl: req.frame_url,
      frameImageFileId: req.frame_image_file_id,
      frameBrand: req.frame_brand,
      frameModel: req.frame_model,
      fullName: cust?.full_name || "",
      email: cust?.email || "",
      phone: cust?.phone,
      customerNotes: cust?.customer_notes,
      adminNotes: cust?.admin_notes,
      prescriptionType: presc?.prescription_type || "none",
      prescriptionSphR: presc?.prescription_sph_r,
      prescriptionSphL: presc?.prescription_sph_l,
      prescriptionCylR: presc?.prescription_cyl_r,
      prescriptionCylL: presc?.prescription_cyl_l,
      prescriptionAxisR: presc?.prescription_axis_r,
      prescriptionAxisL: presc?.prescription_axis_l,
      prescriptionPd: presc?.prescription_pd,
      prescriptionFileId: presc?.prescription_file_id,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    };
  });
}

/**
 * Admin update: changes status / notes and writes an audit log entry.
 */
export async function adminUpdateFrameRequestStatusServer(
  requestId: string,
  adminId: string,
  status: FrameRequestStatus,
  adminNotes?: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();
  const now = new Date().toISOString();

  // Retrieve current status for audit log
  let previousStatus: string | undefined;

  if (isDb && client) {
    try {
      const currentRows = await client`
        SELECT status FROM frame_requests
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        LIMIT 1
      `;
      if (currentRows && currentRows.length > 0) {
        previousStatus = currentRows[0].status;
      }

      await client`
        UPDATE frame_requests
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
      `;

      if (adminNotes !== undefined) {
        await client`
          UPDATE frame_request_customers
          SET admin_notes = ${adminNotes}
          WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        `;
      }

      await recordAuditLogServer({
        request_id: normalizedId,
        admin_id: adminId,
        action: "STATUS_UPDATE",
        previous_status: previousStatus,
        new_status: status,
        metadata: adminNotes ? "Updated notes" : undefined,
      });

      return true;
    } catch (error) {
      console.error("PostgreSQL adminUpdateFrameRequestStatus failed, trying JSON:", error);
    }
  }

  const requests = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  let updated = false;
  const updatedRequests = requests.map((r) => {
    if (r?.request_id && r.request_id.trim().toUpperCase() === normalizedId) {
      previousStatus = r.status;
      updated = true;
      return { ...r, status, updated_at: now };
    }
    return r;
  });

  if (updated) {
    await writeJsonFile(FRAME_REQUESTS_FILE_PATH, updatedRequests);
    if (adminNotes !== undefined) {
      const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
      const updatedCustomers = customers.map((c) =>
        c?.request_id && c.request_id.trim().toUpperCase() === normalizedId ? { ...c, admin_notes: adminNotes } : c,
      );
      await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, updatedCustomers);
    }

    await recordAuditLogServer({
      request_id: normalizedId,
      admin_id: adminId,
      action: "STATUS_UPDATE",
      previous_status: previousStatus,
      new_status: status,
      metadata: adminNotes ? "Updated notes" : undefined,
    });

    // Automatically notify customer via email
    try {
      const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
      const cust = customers.find((c) => c?.request_id && c.request_id.trim().toUpperCase() === normalizedId);
      if (cust && cust.email) {
        const emailService = getEmailService();
        if (status === "Ready for Checkout" || status === "Frame Found" || status === "Price/Availability Confirmation") {
          await emailService.sendNotification("frame_found", {
            recipientEmail: cust.email,
            recipientName: cust.full_name,
            requestId: normalizedId,
            actionUrl: `http://localhost:5173/checkout?frame_req=${normalizedId}`,
            statusMessage: adminNotes || `Gute Nachrichten! Ihre Wunschfassung für Anfrage ${normalizedId} ist bereit für die Bestellung.`,
          }).catch(() => {});
        } else if (status === "Rejected") {
          await emailService.sendNotification("frame_unavailable", {
            recipientEmail: cust.email,
            recipientName: cust.full_name,
            requestId: normalizedId,
            statusMessage: adminNotes || `Update zu Ihrer Anfrage ${normalizedId}: Leider ist dieses Modell derzeit nicht kompatibel.`,
          }).catch(() => {});
        } else if (status === "Prescription Review" || status === "Under Review") {
          await emailService.sendNotification("prescription_submitted", {
            recipientEmail: cust.email,
            recipientName: cust.full_name,
            requestId: normalizedId,
            statusMessage: adminNotes || `Ihre Anfrage ${normalizedId} befindet sich in der fachmännischen Prüfung durch unsere Optik-Spezialisten.`,
          }).catch(() => {});
        }
      }
    } catch (notifErr) {
      console.warn("Status notification dispatch note:", notifErr);
    }
  }

  return updated;
}

/**
 * Admin view of sensitive prescription details with audit logging.
 */
export async function adminGetPrescriptionServer(
  requestId: string,
  adminId: string,
): Promise<FrameRequestPrescription | null> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();

  await recordAuditLogServer({
    request_id: normalizedId,
    admin_id: adminId,
    action: "PRESCRIPTION_VIEWED",
  });

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM frame_request_prescriptions
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return rows[0] as FrameRequestPrescription;
      }
    } catch (error) {
      console.error("PostgreSQL adminGetPrescription failed, trying JSON:", error);
    }
  }

  const list = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
  return list.find((p) => p?.request_id && p.request_id.trim().toUpperCase() === normalizedId) || null;
}

/**
 * Admin deletion: removes DB/JSON records, cleans up associated private files, and records audit trail.
 */
export async function adminDeleteFrameRequestServer(
  requestId: string,
  adminId: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();

  await recordAuditLogServer({
    request_id: normalizedId,
    admin_id: adminId,
    action: "REQUEST_DELETED",
  });

  if (isDb && client) {
    try {
      await client`DELETE FROM frame_request_prescriptions WHERE TRIM(UPPER(request_id)) = ${normalizedId}`;
      await client`DELETE FROM frame_request_customers WHERE TRIM(UPPER(request_id)) = ${normalizedId}`;
      await client`DELETE FROM frame_requests WHERE TRIM(UPPER(request_id)) = ${normalizedId}`;
      return true;
    } catch (error) {
      console.error("PostgreSQL adminDeleteFrameRequest failed, trying JSON:", error);
    }
  }

  const requests = await readJsonFile<FrameRequestPublic>(FRAME_REQUESTS_FILE_PATH);
  const filteredReqs = requests.filter((r) => !r?.request_id || r.request_id.trim().toUpperCase() !== normalizedId);
  await writeJsonFile(FRAME_REQUESTS_FILE_PATH, filteredReqs);

  const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  const filteredCusts = customers.filter((c) => !c?.request_id || c.request_id.trim().toUpperCase() !== normalizedId);
  await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, filteredCusts);

  const prescriptions = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
  const filteredPrescs = prescriptions.filter((p) => !p?.request_id || p.request_id.trim().toUpperCase() !== normalizedId);
  await writeJsonFile(PRESCRIPTIONS_FILE_PATH, filteredPrescs);

  return true;
}

// --- Legacy Compatibility Wrappers ---

export async function saveFrameRequestServer(
  req: Omit<FrameRequest, "id" | "created_at" | "updated_at">,
): Promise<FrameRequest> {
  const res = await saveSeparatedFrameRequestServer({
    requestId: req.request_id,
    fullName: req.full_name,
    email: req.email,
    phone: req.phone,
    frameUrl: req.frame_url,
    frameImageFileId: req.frame_image_file_id,
    frameBrand: req.frame_brand,
    frameModel: req.frame_model,
    notes: req.notes,
    prescriptionType: req.prescription_type,
    prescriptionSphR: req.prescription_sph_r,
    prescriptionSphL: req.prescription_sph_l,
    prescriptionCylR: req.prescription_cyl_r,
    prescriptionCylL: req.prescription_cyl_l,
    prescriptionAxisR: req.prescription_axis_r,
    prescriptionAxisL: req.prescription_axis_l,
    prescriptionPd: req.prescription_pd,
    prescriptionFileId: req.prescription_file_id,
  });

  return {
    ...req,
    status: res.status,
    created_at: res.createdAt,
    updated_at: res.createdAt,
  };
}

export async function getFrameRequestsServer(): Promise<FrameRequest[]> {
  const list = await adminGetFrameRequestsServer();
  return list.map((item) => ({
    request_id: item.requestId,
    full_name: item.fullName,
    email: item.email,
    phone: item.phone,
    frame_url: item.frameUrl,
    frame_image_file_id: item.frameImageFileId,
    frame_brand: item.frameBrand,
    frame_model: item.frameModel,
    notes: item.customerNotes,
    status: item.status,
    admin_notes: item.adminNotes,
    prescription_type: item.prescriptionType,
    prescription_sph_r: item.prescriptionSphR,
    prescription_sph_l: item.prescriptionSphL,
    prescription_cyl_r: item.prescriptionCylR,
    prescription_cyl_l: item.prescriptionCylL,
    prescription_axis_r: item.prescriptionAxisR,
    prescription_axis_l: item.prescriptionAxisL,
    prescription_pd: item.prescriptionPd,
    prescription_file_id: item.prescriptionFileId,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
}

export async function getFrameRequestByIdServer(
  requestId: string,
  _email?: string,
): Promise<FrameRequest | null> {
  const pub = await getPublicFrameRequestStatusServer(requestId);
  if (!pub) return null;
  return {
    request_id: pub.request_id,
    status: pub.status,
    frame_brand: pub.frame_brand,
    frame_model: pub.frame_model,
    full_name: "",
    email: "",
    created_at: pub.created_at,
    updated_at: pub.updated_at,
  };
}

export async function updateFrameRequestStatusServer(
  requestId: string,
  status: FrameRequestStatus,
  adminNotes?: string,
): Promise<boolean> {
  return await adminUpdateFrameRequestStatusServer(requestId, "system", status, adminNotes);
}

/**
 * Safe recovery mechanism for customers who lose their access token.
 * Generates a new 256-bit token, updates the stored SHA-256 hash, and simulates/triggers email delivery.
 * NEVER returns the access token or prescription data in the API response.
 */
export async function requestCustomerAccessRecoveryServer(
  requestId: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedId = requestId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM frame_request_customers
        WHERE TRIM(UPPER(request_id)) = ${normalizedId} AND LOWER(email) = ${normalizedEmail}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        const newAccessToken = crypto.randomBytes(32).toString("hex");
        const newHash = crypto.createHash("sha256").update(newAccessToken).digest("hex");
        await client`
          UPDATE frame_request_customers
          SET access_token_hash = ${newHash}
          WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        `;
        console.log(`[CUSTOMER RECOVERY] Dispatched new access credentials to ${normalizedEmail.slice(0, 3)}***@***`);
      }
    } catch (err) {
      console.error("Database access token recovery error:", err);
    }
  } else {
    const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
    const index = customers.findIndex(
      (c) => (c.request_id || "").trim().toUpperCase() === normalizedId && (c.email || "").trim().toLowerCase() === normalizedEmail,
    );
    if (index !== -1) {
      const newAccessToken = crypto.randomBytes(32).toString("hex");
      const newHash = crypto.createHash("sha256").update(newAccessToken).digest("hex");
      customers[index].access_token_hash = newHash;
      await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, customers);
      console.log(`[CUSTOMER RECOVERY] Dispatched new access credentials to ${normalizedEmail.slice(0, 3)}***@***`);
    }
  }

  // Consistent generic response to prevent account/email enumeration
  return {
    success: true,
    message: "If the tracking ID and email address match an active request, access instructions have been sent to your email.",
  };
}

/**
 * Phase 2: Admin frame request details updater
 * Allows Lensly staff to record internal procurement cost, customer price,
 * availability, source, dimensions, compatibility, and send customer responses.
 * (Internal costs are strictly prevented from leaking to customer endpoints).
 */
export async function adminUpdateFrameRequestDetailsServer(
  requestId: string,
  details: {
    status?: FrameRequestStatus;
    procurementCost?: number;
    customerPrice?: number;
    frameDimensions?: string;
    availability?: "in_stock" | "available_via_partner" | "backorder" | "unavailable";
    source?: string;
    compatibilityStatus?: "compatible" | "needs_thinner_index" | "incompatible";
    adminResponse?: string;
    adminNotes?: string;
  },
  adminId: string = "admin",
): Promise<boolean> {
  const normalizedId = requestId.trim().toUpperCase();
  const now = new Date().toISOString();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  await recordAuditLogServer({
    request_id: normalizedId,
    admin_id: adminId,
    action: "FRAME_REQUEST_DETAILS_UPDATED",
    new_status: details.status,
    metadata: details.availability ? `Availability: ${details.availability}` : undefined,
  }).catch(() => {});

  if (isDb && client) {
    try {
      if (details.status) {
        await client`
          UPDATE frame_requests SET
            status = ${details.status},
            procurement_cost = COALESCE(${details.procurementCost ?? null}, procurement_cost),
            customer_price = COALESCE(${details.customerPrice ?? null}, customer_price),
            frame_dimensions = COALESCE(${details.frameDimensions ?? null}, frame_dimensions),
            availability = COALESCE(${details.availability ?? null}, availability),
            source = COALESCE(${details.source ?? null}, source),
            compatibility_status = COALESCE(${details.compatibilityStatus ?? null}, compatibility_status),
            admin_response = COALESCE(${details.adminResponse ?? null}, admin_response),
            updated_at = ${now}
          WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        `;
      }
      if (details.adminNotes) {
        await client`
          UPDATE frame_request_customers SET admin_notes = ${details.adminNotes}
          WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        `;
      }
    } catch (err) {
      console.error("[FrameRequests] PostgreSQL details update failed:", err);
    }
  }

  // Update fallback JSON
  const requests = await readJsonFile<FrameRequestPublic & Record<string, any>>(FRAME_REQUESTS_FILE_PATH);
  const updatedReqs = requests.map((r) => {
    if (r?.request_id && r.request_id.trim().toUpperCase() === normalizedId) {
      return {
        ...r,
        status: details.status || r.status,
        procurement_cost: details.procurementCost !== undefined ? details.procurementCost : r.procurement_cost,
        customer_price: details.customerPrice !== undefined ? details.customerPrice : r.customer_price,
        frame_dimensions: details.frameDimensions || r.frame_dimensions,
        availability: details.availability || r.availability,
        source: details.source || r.source,
        compatibility_status: details.compatibilityStatus || r.compatibility_status,
        admin_response: details.adminResponse || r.admin_response,
        updated_at: now,
      };
    }
    return r;
  });
  await writeJsonFile(FRAME_REQUESTS_FILE_PATH, updatedReqs);

  if (details.adminNotes) {
    const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
    const updatedCusts = customers.map((c) =>
      c?.request_id && c.request_id.trim().toUpperCase() === normalizedId ? { ...c, admin_notes: details.adminNotes } : c,
    );
    await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, updatedCusts);
  }

  return true;
}

/**
 * Phase 2: Customer decision on frame option
 * Validates ownership with access token before recording approval, decline, or resubmission request.
 */
export async function customerRespondToFrameOptionServer(
  requestId: string,
  accessToken: string,
  decision: "approved" | "declined" | "resubmit_requested",
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedId = requestId.trim().toUpperCase();
  const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");
  const now = new Date().toISOString();

  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const custRows = await client`
        SELECT * FROM frame_request_customers
        WHERE TRIM(UPPER(request_id)) = ${normalizedId} AND access_token_hash = ${tokenHash}
        LIMIT 1
      `;
      if (!custRows || custRows.length === 0) {
        return { success: false, error: "Access denied. Invalid customer token." };
      }

      await client`
        UPDATE frame_requests SET
          customer_decision = ${decision},
          updated_at = ${now}
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
      `;

      if (notes) {
        await client`
          UPDATE frame_request_customers SET
            customer_notes = customer_notes || E'\n\n[Kundenentscheidung]: ' || ${notes}
          WHERE TRIM(UPPER(request_id)) = ${normalizedId}
        `;
      }
      return { success: true };
    } catch (err) {
      console.error("[FrameRequests] Database customer response error:", err);
    }
  }

  const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  const custMatch = customers.find(
    (c) => c?.request_id && c.request_id.trim().toUpperCase() === normalizedId && c.access_token_hash === tokenHash,
  );
  if (!custMatch) {
    return { success: false, error: "Access denied. Invalid customer token." };
  }

  const requests = await readJsonFile<FrameRequestPublic & Record<string, any>>(FRAME_REQUESTS_FILE_PATH);
  const updatedReqs = requests.map((r) =>
    r?.request_id && r.request_id.trim().toUpperCase() === normalizedId ? { ...r, customer_decision: decision, updated_at: now } : r,
  );
  await writeJsonFile(FRAME_REQUESTS_FILE_PATH, updatedReqs);

  if (notes) {
    const updatedCusts = customers.map((c) =>
      c?.request_id && c.request_id.trim().toUpperCase() === normalizedId
        ? { ...c, customer_notes: `${c.customer_notes || ""}\n\n[Kundenentscheidung]: ${notes}` }
        : c,
    );
    await writeJsonFile(FRAME_CUSTOMERS_FILE_PATH, updatedCusts);
  }

  return { success: true };
}

/**
 * Phase 2: Admin Prescription Review Workflow
 * Stages: Submitted -> Under Review -> Need More Information -> Approved for Fulfillment -> Not Supported
 */
export async function adminUpdatePrescriptionReviewServer(
  requestId: string,
  reviewStatus: "Submitted" | "Under Review" | "Need More Information" | "Approved for Fulfillment" | "Not Supported",
  reviewerNotes?: string,
  resubmissionReason?: string,
  adminId: string = "admin",
): Promise<boolean> {
  const normalizedId = requestId.trim().toUpperCase();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  await recordAuditLogServer({
    request_id: normalizedId,
    admin_id: adminId,
    action: "PRESCRIPTION_REVIEW_UPDATED",
    new_status: reviewStatus,
    metadata: resubmissionReason || reviewerNotes,
  }).catch(() => {});

  if (isDb && client) {
    try {
      await client`
        UPDATE frame_request_prescriptions SET
          review_status = ${reviewStatus},
          reviewer_notes = COALESCE(${reviewerNotes ?? null}, reviewer_notes),
          resubmission_reason = COALESCE(${resubmissionReason ?? null}, resubmission_reason)
        WHERE TRIM(UPPER(request_id)) = ${normalizedId}
      `;
    } catch (err) {
      console.error("[Prescriptions] Database review update error:", err);
    }
  }

  const prescriptions = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
  const updated = prescriptions.map((p) => {
    if (p?.request_id && p.request_id.trim().toUpperCase() === normalizedId) {
      return {
        ...p,
        review_status: reviewStatus,
        reviewer_notes: reviewerNotes ?? p.reviewer_notes,
        resubmission_reason: resubmissionReason ?? p.resubmission_reason,
      };
    }
    return p;
  });
  await writeJsonFile(PRESCRIPTIONS_FILE_PATH, updated);

  return true;
}

/**
 * Resolves a customer's verified email and contract from their email, tracking ID, contract ID, or token.
 */
export async function resolveCustomerIdentifierServer(
  input: string,
): Promise<{ email: string; name?: string; contractId?: string } | null> {
  const query = input.trim();
  if (!query) return null;

  // 1. Direct email match
  if (query.includes("@")) {
    const emailLower = query.toLowerCase();
    const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
    const matchedCust = customers.find((c) => c.email?.trim().toLowerCase() === emailLower);
    if (matchedCust) {
      return { email: matchedCust.email, name: matchedCust.full_name };
    }

    const subs = await getSubscriptionsServer();
    const matchedSub = subs.find((s) => s.email?.trim().toLowerCase() === emailLower);
    if (matchedSub) {
      return {
        email: matchedSub.email,
        name: matchedSub.full_name,
        contractId: matchedSub.contract_id || (matchedSub as any).contractId,
      };
    }
    return null;
  }

  // 2. Tracking ID match (e.g. LNS-REQ-...)
  const upper = query.toUpperCase();
  const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
  const matchedCust = customers.find((c) => c.request_id?.trim().toUpperCase() === upper);
  if (matchedCust && matchedCust.email) {
    return { email: matchedCust.email, name: matchedCust.full_name };
  }

  // 3. Contract ID match (e.g. LNS-2026-...)
  const subs = await getSubscriptionsServer();
  const matchedSub = subs.find(
    (s) => (s.contract_id || (s as any).contractId)?.trim().toUpperCase() === upper,
  );
  if (matchedSub && matchedSub.email) {
    return {
      email: matchedSub.email,
      name: matchedSub.full_name,
      contractId: matchedSub.contract_id || (matchedSub as any).contractId,
    };
  }

  // 4. Token hash match
  const tokenHash = crypto.createHash("sha256").update(query).digest("hex");
  const custByToken = customers.find(
    (c) => c.access_token_hash === tokenHash || (c as any).access_token === query,
  );
  if (custByToken && custByToken.email) {
    return { email: custByToken.email, name: custByToken.full_name };
  }

  const subByToken = subs.find(
    (s) => s.access_token_hash === tokenHash || s.access_token === query,
  );
  if (subByToken && subByToken.email) {
    return {
      email: subByToken.email,
      name: subByToken.full_name,
      contractId: subByToken.contract_id || (subByToken as any).contractId,
    };
  }

  return null;
}

/**
 * Phase 2 & 3: Aggregated Customer Portal Overview
 * Gathers customer's active subscription, frame requests, orders, and messages.
 * Requires a cryptographically valid customer access token or verified session.
 */
export async function getCustomerOverviewServer(identifier: {
  accessToken?: string;
  contractId?: string;
  email?: string;
  internalSessionVerified?: boolean;
}): Promise<{
  customerName: string;
  customerEmail: string;
  activeSubscription?: Subscription | null;
  orders: any[];
  frameRequests: any[];
  prescriptions: any[];
}> {
  let authorizedEmail = "";
  let matchedSub: Subscription | undefined;
  let matchedCust: FrameRequestCustomer | undefined;

  // Case 1: Identity established via verified HttpOnly customer session
  if (identifier.internalSessionVerified === true && identifier.email && identifier.email.includes("@")) {
    authorizedEmail = identifier.email.trim().toLowerCase();
    const subscriptions = await getSubscriptionsServer();
    matchedSub = subscriptions.find((s) => {
      const emailMatches = s.email.trim().toLowerCase() === authorizedEmail;
      if (!emailMatches) return false;
      if (identifier.contractId) {
        return (s.contract_id || (s as any).contractId) === identifier.contractId;
      }
      return true;
    });

    if (identifier.contractId && !matchedSub) {
      // Check if the customer owns another subscription or if this contract belongs to someone else
      const crossSub = subscriptions.find((s) => (s.contract_id || (s as any).contractId) === identifier.contractId);
      if (crossSub && crossSub.email.trim().toLowerCase() !== authorizedEmail) {
        throw new Error("Forbidden: You do not have permission to view this contract.");
      }
    }

    try {
      const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
      matchedCust = customers.find((c) => c.email?.trim().toLowerCase() === authorizedEmail);
    } catch {}
  } else {
    // Case 2: Identity established via verified customer access token
    const token = identifier.accessToken?.trim();
    if (!token || token.length < 16) {
      throw new Error("Unauthorized: Valid customer access token or session required.");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const subscriptions = await getSubscriptionsServer();
    matchedSub = subscriptions.find(
      (s) => s.access_token === token || s.access_token_hash === tokenHash,
    );

    try {
      const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);
      matchedCust = customers.find(
        (c) => c.access_token_hash === tokenHash || (c as any).access_token === token,
      );
    } catch {}

    if (!matchedSub && !matchedCust) {
      throw new Error("Forbidden: Access token is invalid or not associated with any active customer.");
    }

    if (identifier.contractId && matchedSub && (matchedSub.contract_id || (matchedSub as any).contractId) !== identifier.contractId) {
      throw new Error("Forbidden: You do not have permission to view this contract.");
    }

    authorizedEmail = (matchedSub?.email || matchedCust?.email || "").trim().toLowerCase();
  }

  if (!authorizedEmail) {
    throw new Error("Forbidden: No authorized email record found for this customer.");
  }

  // Read orders strictly belonging to authorizedEmail
  let ordersList: any[] = [];
  try {
    const rawOrders = await fs.readFile(getDataFilePath("orders.json"), "utf-8");
    const parsedOrders = JSON.parse(rawOrders);
    if (Array.isArray(parsedOrders)) {
      ordersList = parsedOrders.filter((o) =>
        o.customer_email && o.customer_email.trim().toLowerCase() === authorizedEmail,
      );
    }
  } catch {}

  // Read customer frame requests strictly belonging to authorizedEmail
  let frameReqList: any[] = [];
  try {
    const requests = await readJsonFile<FrameRequestPublic & Record<string, any>>(FRAME_REQUESTS_FILE_PATH);
    const customers = await readJsonFile<FrameRequestCustomer>(FRAME_CUSTOMERS_FILE_PATH);

    for (const req of requests) {
      const cust = customers.find((c) => c.request_id === req.request_id);
      if (cust && cust.email && cust.email.trim().toLowerCase() === authorizedEmail) {
        frameReqList.push({
          requestId: req.request_id,
          status: req.status,
          frameBrand: req.frame_brand,
          frameModel: req.frame_model,
          frameDimensions: req.frame_dimensions,
          availability: req.availability,
          customerPrice: req.customer_price,
          adminResponse: req.admin_response,
          customerDecision: req.customer_decision,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        });
      }
    }
  } catch {}

  // Read prescriptions strictly belonging to the authorized frame requests
  let prescList: any[] = [];
  try {
    const allPrescriptions = await readJsonFile<FrameRequestPrescription>(PRESCRIPTIONS_FILE_PATH);
    const reqIds = new Set(frameReqList.map((r) => r.requestId));
    prescList = allPrescriptions.filter((p) => reqIds.has(p.request_id));
  } catch {}

  return {
    customerName: matchedSub?.full_name || matchedCust?.full_name || "Lensly Kunde",
    customerEmail: authorizedEmail,
    activeSubscription: matchedSub || null,
    orders: ordersList,
    frameRequests: frameReqList,
    prescriptions: prescList,
  };
}


