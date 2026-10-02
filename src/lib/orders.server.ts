import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { getSqlClient, ensureDbInitialized, recordAuditLogServer } from "./subscriptions.server";
import { getEmailService } from "./notifications.server";
import { getDataFilePath } from "./data-dir.server";

export type OrderStatus =
  | "Requested"
  | "Verified"
  | "Confirmed"
  | "Processing"
  | "Lens Production"
  | "Quality Check"
  | "Shipped"
  | "Delivered";

export const ORDER_STATUS_PIPELINE: OrderStatus[] = [
  "Requested",
  "Verified",
  "Confirmed",
  "Processing",
  "Lens Production",
  "Quality Check",
  "Shipped",
  "Delivered",
];

export interface OrderRecord {
  id?: number;
  order_id: string; // e.g. LNS-ORD-<16 HEX>
  contract_id?: string;
  request_id?: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  frame_brand?: string;
  frame_model?: string;
  lens_type: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

const ORDERS_FILE_PATH = getDataFilePath("orders.json");

async function readOrdersJson(): Promise<OrderRecord[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeOrdersJson(orders: OrderRecord[]): Promise<void> {
  try {
    await fs.writeFile(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("[Orders] Failed to write orders.json:", err);
  }
}

export function generateOrderId(): string {
  const entropy = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `LNS-ORD-${entropy}`;
}

export async function createOrderServer(
  data: Omit<OrderRecord, "id" | "order_id" | "created_at" | "updated_at"> & { order_id?: string },
): Promise<OrderRecord> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const now = new Date().toISOString();
  const orderId = data.order_id || generateOrderId();

  const newOrder: OrderRecord = {
    ...data,
    order_id: orderId,
    status: data.status || "Requested",
    created_at: now,
    updated_at: now,
  };

  if (isDb && client) {
    try {
      await client`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(100) UNIQUE NOT NULL,
          contract_id VARCHAR(100),
          request_id VARCHAR(100),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'Requested' NOT NULL,
          frame_brand VARCHAR(100),
          frame_model VARCHAR(100),
          lens_type VARCHAR(100) DEFAULT 'Single Vision',
          carrier VARCHAR(50),
          tracking_number VARCHAR(100),
          estimated_delivery VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;

      await client`
        INSERT INTO orders (
          order_id, contract_id, request_id, customer_name, customer_email,
          status, frame_brand, frame_model, lens_type, carrier, tracking_number,
          estimated_delivery, created_at, updated_at
        ) VALUES (
          ${newOrder.order_id},
          ${newOrder.contract_id ?? null},
          ${newOrder.request_id ?? null},
          ${newOrder.customer_name},
          ${newOrder.customer_email},
          ${newOrder.status},
          ${newOrder.frame_brand ?? null},
          ${newOrder.frame_model ?? null},
          ${newOrder.lens_type},
          ${newOrder.carrier ?? null},
          ${newOrder.tracking_number ?? null},
          ${newOrder.estimated_delivery ?? null},
          ${newOrder.created_at},
          ${newOrder.updated_at}
        )
      `;
    } catch (err) {
      console.error("[Orders] PostgreSQL insert failed, falling back to JSON:", err);
    }
  }

  const list = await readOrdersJson();
  list.unshift(newOrder);
  await writeOrdersJson(list);

  // Dispatch notification
  const emailService = getEmailService();
  await emailService.sendNotification("order_confirmed", {
    recipientEmail: newOrder.customer_email,
    recipientName: newOrder.customer_name,
    orderId: newOrder.order_id,
    frameBrand: newOrder.frame_brand,
    frameModel: newOrder.frame_model,
    statusMessage: `Ihre Bestellung ${newOrder.order_id} wurde erfolgreich angelegt.`,
  }).catch(() => {});

  return newOrder;
}

export async function getOrdersServer(filter?: {
  email?: string;
  status?: string;
}): Promise<OrderRecord[]> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      let rows;
      if (filter?.email) {
        rows = await client`SELECT * FROM orders WHERE LOWER(customer_email) = ${filter.email.trim().toLowerCase()} ORDER BY created_at DESC`;
      } else if (filter?.status) {
        rows = await client`SELECT * FROM orders WHERE status = ${filter.status} ORDER BY created_at DESC`;
      } else {
        rows = await client`SELECT * FROM orders ORDER BY created_at DESC`;
      }
      if (rows && rows.length > 0) {
        return rows as unknown as OrderRecord[];
      }
    } catch (err) {
      console.error("[Orders] PostgreSQL query failed, using JSON fallback:", err);
    }
  }

  let list = await readOrdersJson();
  if (filter?.email) {
    list = list.filter((o) => o.customer_email.trim().toLowerCase() === filter.email!.trim().toLowerCase());
  }
  if (filter?.status) {
    list = list.filter((o) => o.status === filter.status);
  }
  return list;
}

export async function getOrderByIdServer(orderId: string): Promise<OrderRecord | null> {
  const normalized = orderId.trim().toUpperCase();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      const rows = await client`SELECT * FROM orders WHERE UPPER(order_id) = ${normalized} LIMIT 1`;
      if (rows && rows.length > 0) return rows[0] as unknown as OrderRecord;
    } catch {}
  }

  const list = await readOrdersJson();
  return list.find((o) => o.order_id.trim().toUpperCase() === normalized) || null;
}

export async function updateOrderStatusServer(
  orderId: string,
  newStatus: OrderStatus,
  details?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    notes?: string;
    adminId?: string;
  },
  adminId: string = "admin",
): Promise<OrderRecord | null> {
  const normalized = orderId.trim().toUpperCase();
  const now = new Date().toISOString();
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  const existing = await getOrderByIdServer(orderId);
  if (!existing) return null;

  const prevStatus = existing.status;

  if (isDb && client) {
    try {
      await client`
        UPDATE orders SET
          status = ${newStatus},
          carrier = COALESCE(${details?.carrier ?? null}, carrier),
          tracking_number = COALESCE(${details?.trackingNumber ?? null}, tracking_number),
          estimated_delivery = COALESCE(${details?.estimatedDelivery ?? null}, estimated_delivery),
          updated_at = ${now}
        WHERE UPPER(order_id) = ${normalized}
      `;
    } catch (err) {
      console.error("[Orders] PostgreSQL update failed, falling back to JSON:", err);
    }
  }

  const list = await readOrdersJson();
  let updatedOrder: OrderRecord | null = null;
  const updatedList = list.map((o) => {
    if (o.order_id.trim().toUpperCase() === normalized) {
      updatedOrder = {
        ...o,
        status: newStatus,
        carrier: details?.carrier ?? o.carrier,
        tracking_number: details?.trackingNumber ?? o.tracking_number,
        estimated_delivery: details?.estimatedDelivery ?? o.estimated_delivery,
        updated_at: now,
      };
      return updatedOrder;
    }
    return o;
  });
  await writeOrdersJson(updatedList);

  // Audit log
  await recordAuditLogServer({
    request_id: normalized,
    admin_id: adminId,
    action: "ORDER_STATUS_CHANGED",
    previous_status: prevStatus,
    new_status: newStatus,
    metadata: details?.trackingNumber ? `Carrier: ${details.carrier}, Track: ${details.trackingNumber}` : undefined,
  }).catch(() => {});

  // Trigger contextual notification
  const emailService = getEmailService();
  if (newStatus === "Processing" || newStatus === "Lens Production") {
    await emailService.sendNotification("order_processing", {
      recipientEmail: existing.customer_email,
      recipientName: existing.customer_name,
      orderId: existing.order_id,
      statusMessage: `Ihre Gläser befinden sich nun in der Präzisionsfertigung (${newStatus}).`,
    }).catch(() => {});
  } else if (newStatus === "Shipped") {
    await emailService.sendNotification("order_shipped", {
      recipientEmail: existing.customer_email,
      recipientName: existing.customer_name,
      orderId: existing.order_id,
      statusMessage: `Ihre Brille wurde versandt via ${details?.carrier || existing.carrier || "DHL"}. Sendungsnummer: ${details?.trackingNumber || existing.tracking_number || "Bereitgestellt"}`,
    }).catch(() => {});
  } else if (newStatus === "Delivered") {
    await emailService.sendNotification("order_delivered", {
      recipientEmail: existing.customer_email,
      recipientName: existing.customer_name,
      orderId: existing.order_id,
      statusMessage: `Ihre Brille wurde erfolgreich zugestellt. Wir wünschen Ihnen perfekte Sicht!`,
    }).catch(() => {});
  }

  return updatedOrder || existing;
}
