import postgres from "postgres";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getServerConfig } from "./config.server";

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
  status: "active" | "cancelled" | "withdrawn" | "pending" | "paused" | "archived";
  created_at?: string;
  updated_at?: string;
}

const FALLBACK_FILE_PATH = path.resolve(process.cwd(), "subscriptions.json");

let sql: postgres.Sql | null = null;
let dbInitialized = false;

function getSqlClient() {
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

export async function ensureDbInitialized(): Promise<boolean> {
  if (dbInitialized) return true;

  const client = getSqlClient();
  if (!client) {
    console.log(
      "No DATABASE_URL configured or client initialization failed. Falling back to subscriptions.json file storage.",
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

    // Add indices to speed up common searches
    await client`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
    `;
    await client`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_contract_id ON subscriptions(contract_id);
    `;

    dbInitialized = true;
    console.log("Successfully connected to PostgreSQL and validated subscriptions table schema.");
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

  const newSub: Subscription = {
    ...sub,
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
  const filtered = list.filter((item) => item.contract_id !== sub.contract_id);
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
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error("PostgreSQL select failed, falling back to local JSON file storage:", error);
    }
  }

  const list = await readFromJsonFile();
  return list.sort(
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
  }
  return updated;
}

export async function confirmSubscriptionPaymentServer(
  contractId: string,
  email: string,
  paymentMethod: "sepa" | "wallet",
  maskedIban: string,
): Promise<boolean> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();
  const normalizedContract = contractId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (isDb && client) {
    try {
      const rows = await client`
        UPDATE subscriptions
        SET status = 'active',
            payment_method = ${paymentMethod},
            masked_iban = ${maskedIban},
            updated_at = CURRENT_TIMESTAMP
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        RETURNING id
      `;
      if (rows && rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL payment confirmation failed, trying fallback:", error);
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
        status: "active" as const,
        payment_method: paymentMethod,
        masked_iban: maskedIban,
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

export async function deleteSubscriptionServer(
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
        DELETE FROM subscriptions
        WHERE TRIM(UPPER(contract_id)) = ${normalizedContract} AND TRIM(LOWER(email)) = ${normalizedEmail}
        RETURNING id
      `;
      if (rows && rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("PostgreSQL delete failed, trying fallback:", error);
    }
  }

  // Fallback: JSON file update
  const list = await readFromJsonFile();
  const initialLength = list.length;
  const filtered = list.filter(
    (item) =>
      item.contract_id.trim().toUpperCase() !== normalizedContract ||
      item.email.trim().toLowerCase() !== normalizedEmail,
  );
  if (filtered.length !== initialLength) {
    await writeToJsonFile(filtered);
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
