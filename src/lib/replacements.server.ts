import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { getSqlClient, ensureDbInitialized, recordAuditLogServer } from "./subscriptions.server";
import { checkReplacementAllowance } from "./pricing";
import { getDataFilePath } from "./data-dir.server";

export type ReplacementReason = "accidental_damage" | "lost_item" | "prescription_change" | "other";
export type ReplacementStatus = "submitted" | "under_review" | "approved" | "rejected" | "fulfilled" | "dispatched";

export interface ReplacementRecord {
  id: string; // e.g. LNS-REP-<16 HEX>
  contract_id?: string;
  customer_email: string;
  previous_order_id?: string;
  reason: ReplacementReason;
  description: string;
  evidence_file_id?: string;
  status: ReplacementStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const REPLACEMENTS_FILE_PATH = getDataFilePath("replacement_requests.json");

async function readReplacementsJson(): Promise<ReplacementRecord[]> {
  try {
    const raw = await fs.readFile(REPLACEMENTS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeReplacementsJson(records: ReplacementRecord[]): Promise<void> {
  try {
    await fs.writeFile(REPLACEMENTS_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("[Replacements] Failed to write replacement_requests.json:", err);
  }
}

export function generateReplacementId(): string {
  const entropy = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `LNS-REP-${entropy}`;
}

export async function submitReplacementRequestServer(data: {
  contractId?: string;
  subscriptionId?: string;
  customerEmail?: string;
  email?: string;
  previousOrderId?: string;
  reason: ReplacementReason;
  description: string;
  evidenceFileId?: string;
  planId?: string;
}): Promise<{ success: boolean; replacement?: ReplacementRecord; error?: string }> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const now = new Date().toISOString();
  const id = generateReplacementId();

  const effectiveEmail = (data.customerEmail || data.email || "").trim().toLowerCase();
  const effectiveContractId = data.contractId || data.subscriptionId;

  if (!effectiveEmail) {
    return { success: false, error: "Missing customer email for replacement request." };
  }

  // 1. Verify plan replacement allowance
  const existingRequests = await getReplacementRequestsServer({ email: effectiveEmail });
  const approvedOrFulfilledCount = existingRequests.filter(
    (r) => r.status === "approved" || r.status === "fulfilled" || r.status === "under_review",
  ).length;

  const planId = data.planId || "lensly_care_standard";
  const allowance = checkReplacementAllowance(planId, approvedOrFulfilledCount);

  if (!allowance.eligible) {
    return {
      success: false,
      error: `Ihr vertragliches Kontingent von bis zu ${allowance.maxAllowed} Ersatzanfragen für diesen Abrechnungszeitraum ist bereits ausgeschöpft. Bitte wenden Sie sich an den Kundenservice für weitere Optionen.`,
    };
  }

  const newRecord: ReplacementRecord = {
    id,
    contract_id: effectiveContractId,
    customer_email: effectiveEmail,
    previous_order_id: data.previousOrderId,
    reason: data.reason,
    description: (data.description || "").trim(),
    evidence_file_id: data.evidenceFileId,
    status: "submitted",
    created_at: now,
    updated_at: now,
  };

  if (isDb && client) {
    try {
      await client`
        CREATE TABLE IF NOT EXISTS replacement_requests (
          id VARCHAR(100) PRIMARY KEY,
          contract_id VARCHAR(100),
          customer_email VARCHAR(255) NOT NULL,
          previous_order_id VARCHAR(100),
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence_file_id VARCHAR(100),
          status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
          admin_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;

      await client`
        INSERT INTO replacement_requests (
          id, contract_id, customer_email, previous_order_id, reason,
          description, evidence_file_id, status, created_at, updated_at
        ) VALUES (
          ${newRecord.id},
          ${newRecord.contract_id ?? null},
          ${newRecord.customer_email},
          ${newRecord.previous_order_id ?? null},
          ${newRecord.reason},
          ${newRecord.description},
          ${newRecord.evidence_file_id ?? null},
          ${newRecord.status},
          ${newRecord.created_at},
          ${newRecord.updated_at}
        )
      `;
    } catch (err) {
      console.error("[Replacements] PostgreSQL insert failed, using JSON fallback:", err);
    }
  }

  const list = await readReplacementsJson();
  list.unshift(newRecord);
  await writeReplacementsJson(list);

  return {
    success: true,
    replacement: newRecord,
  };
}

export async function getReplacementRequestsServer(filter?: {
  email?: string;
  contractId?: string;
}): Promise<ReplacementRecord[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      let rows;
      if (filter?.email) {
        rows = await client`SELECT * FROM replacement_requests WHERE LOWER(customer_email) = ${filter.email.trim().toLowerCase()} ORDER BY created_at DESC`;
      } else if (filter?.contractId) {
        rows = await client`SELECT * FROM replacement_requests WHERE contract_id = ${filter.contractId} ORDER BY created_at DESC`;
      } else {
        rows = await client`SELECT * FROM replacement_requests ORDER BY created_at DESC`;
      }
      if (rows && rows.length > 0) {
        return rows as unknown as ReplacementRecord[];
      }
    } catch (err) {
      console.error("[Replacements] PostgreSQL query failed, using JSON fallback:", err);
    }
  }

  let list = await readReplacementsJson();
  if (filter?.email) {
    const target = filter.email.trim().toLowerCase();
    list = list.filter((r) => r.customer_email.trim().toLowerCase() === target);
  }

  return list;
}

export async function updateReplacementStatusServer(
  id: string,
  status: ReplacementStatus,
  adminNotes?: string,
  replacementOrderId?: string,
  adminId: string = "admin",
): Promise<ReplacementRecord | null> {
  const normalized = id.trim().toUpperCase();
  const now = new Date().toISOString();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      await client`
        UPDATE replacement_requests SET
          status = ${status},
          admin_notes = COALESCE(${adminNotes ?? null}, admin_notes),
          updated_at = ${now}
        WHERE UPPER(id) = ${normalized}
      `;
    } catch (err) {
      console.error("[Replacements] PostgreSQL update status failed:", err);
    }
  }

  const list = await readReplacementsJson();
  let updatedRecord: ReplacementRecord | null = null;
  const updatedList = list.map((r) => {
    if (r.id.trim().toUpperCase() === normalized) {
      updatedRecord = {
        ...r,
        status,
        admin_notes: adminNotes ?? r.admin_notes,
        updated_at: now,
      };
      return updatedRecord;
    }
    return r;
  });
  await writeReplacementsJson(updatedList);

  await recordAuditLogServer({
    request_id: normalized,
    admin_id: adminId,
    action: "REPLACEMENT_STATUS_UPDATED",
    new_status: status,
    metadata: adminNotes,
  }).catch(() => {});

  return updatedRecord;
}
