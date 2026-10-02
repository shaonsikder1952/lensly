import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { getSqlClient, ensureDbInitialized } from "./subscriptions.server";
import { getEmailService } from "./notifications.server";
import { getDataFilePath } from "./data-dir.server";

export type MessageReferenceType = "frame_request" | "order" | "prescription" | "support";

export interface MessageRecord {
  id: string;
  reference_type: MessageReferenceType;
  reference_id: string;
  sender: "customer" | "admin";
  sender_name: string;
  message: string;
  read: boolean;
  created_at: string;
}

const MESSAGES_FILE_PATH = getDataFilePath("messages.json");

async function readMessagesJson(): Promise<MessageRecord[]> {
  try {
    const raw = await fs.readFile(MESSAGES_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeMessagesJson(messages: MessageRecord[]): Promise<void> {
  try {
    await fs.writeFile(MESSAGES_FILE_PATH, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    console.error("[Messaging] Failed to write messages.json:", err);
  }
}

export async function getMessagesServer(
  referenceType: MessageReferenceType,
  referenceId: string,
): Promise<MessageRecord[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedRef = referenceId.trim().toUpperCase();

  if (isDb && client) {
    try {
      const rows = await client`
        SELECT * FROM messages
        WHERE reference_type = ${referenceType} AND UPPER(reference_id) = ${normalizedRef}
        ORDER BY created_at ASC
      `;
      if (rows && rows.length > 0) {
        return rows as unknown as MessageRecord[];
      }
    } catch (err) {
      console.error("[Messaging] PostgreSQL query failed, using JSON fallback:", err);
    }
  }

  const list = await readMessagesJson();
  return list
    .filter(
      (m) =>
        m.reference_type === referenceType &&
        m.reference_id.trim().toUpperCase() === normalizedRef,
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export type SendMessageInput = {
  // Option A (snake_case)
  reference_type?: MessageReferenceType;
  reference_id?: string;
  sender?: "customer" | "admin";
  sender_name?: string;
  message?: string;

  // Option B (camelCase / dashboard functions)
  contextType?: MessageReferenceType;
  contextId?: string;
  senderRole?: "customer" | "admin";
  senderEmail?: string;
  senderName?: string;
  body?: string;

  recipientEmail?: string;
};

export async function sendMessageServer(data: SendMessageInput): Promise<MessageRecord> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const id = `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  const refType = (data.reference_type || data.contextType || "support") as MessageReferenceType;
  const refId = (data.reference_id || data.contextId || "general").trim().toUpperCase();
  const senderRole = (data.sender || data.senderRole || "customer") as "customer" | "admin";
  const senderName = (data.sender_name || data.senderName || (senderRole === "admin" ? "Lensly Care Team" : "Kunde")).trim();
  const messageBody = (data.message || data.body || "").trim();

  const newMessage: MessageRecord = {
    id,
    reference_type: refType,
    reference_id: refId,
    sender: senderRole,
    sender_name: senderName,
    message: messageBody,
    read: false,
    created_at: now,
  };

  if (isDb && client) {
    try {
      await client`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(100) PRIMARY KEY,
          reference_type VARCHAR(50) NOT NULL,
          reference_id VARCHAR(100) NOT NULL,
          sender VARCHAR(50) NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;

      await client`
        INSERT INTO messages (
          id, reference_type, reference_id, sender, sender_name, message, read, created_at
        ) VALUES (
          ${newMessage.id},
          ${newMessage.reference_type},
          ${newMessage.reference_id},
          ${newMessage.sender},
          ${newMessage.sender_name},
          ${newMessage.message},
          ${newMessage.read},
          ${newMessage.created_at}
        )
      `;
    } catch (err) {
      console.error("[Messaging] PostgreSQL insert failed, falling back to JSON:", err);
    }
  }

  const list = await readMessagesJson();
  list.push(newMessage);
  await writeMessagesJson(list);

  // If message is sent by admin to customer, trigger notification
  const recipient = data.recipientEmail || (senderRole === "admin" ? data.senderEmail : undefined);
  if (senderRole === "admin" && recipient) {
    const emailService = getEmailService();
    await emailService.sendNotification("support_reply", {
      recipientEmail: recipient,
      recipientName: "Kunde",
      requestId: newMessage.reference_id,
      statusMessage: newMessage.message,
    }).catch(() => {});
  }

  return newMessage;
}

export async function markMessagesReadServer(
  referenceId: string,
  senderToMarkRead: "customer" | "admin",
): Promise<void> {
  const normalizedRef = referenceId.trim().toUpperCase();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      await client`
        UPDATE messages
        SET read = TRUE
        WHERE UPPER(reference_id) = ${normalizedRef} AND sender = ${senderToMarkRead}
      `;
    } catch (err) {
      console.error("[Messaging] PostgreSQL mark read failed:", err);
    }
  }

  const list = await readMessagesJson();
  const updated = list.map((m) =>
    m.reference_id.trim().toUpperCase() === normalizedRef && m.sender === senderToMarkRead
      ? { ...m, read: true }
      : m,
  );
  await writeMessagesJson(updated);
}
