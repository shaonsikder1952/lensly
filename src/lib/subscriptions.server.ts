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
const DELETED_FALLBACK_FILE_PATH = path.resolve(process.cwd(), "deleted_subscriptions.json");

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

function getSqlClient() {
  if (sql) return sql;
  const config = getServerConfig();
  if (!config.databaseUrl) {
    return null;
  }
  const dbUrl = config.databaseUrl.replace(/\r/g, "").trim();
  try {
    sql = postgres(dbUrl, {
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
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'wallet';`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS masked_iban VARCHAR(100);`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS signature_type VARCHAR(20) DEFAULT 'type';`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT '';`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`;
    await client`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`;

    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS profession VARCHAR(100);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS street_address VARCHAR(500);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS city VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS state VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS country VARCHAR(255);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'wallet';`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS masked_iban VARCHAR(100);`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS signature_type VARCHAR(20) DEFAULT 'type';`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT '';`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`;
    await client`ALTER TABLE deleted_subscriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`;

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
  const config = getServerConfig();
  if (config.databaseUrl) {
    const isDb = await ensureDbInitialized();
    const client = getSqlClient();
    if (!isDb || !client) {
      throw new Error("PostgreSQL database configured but connection or initialization failed.");
    }
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
            masked_iban = COALESCE(
              NULLIF(NULLIF(${maskedIban}, 'Stripe Secured'), ''),
              subscriptions.masked_iban,
              'Stripe Secured'
            ),
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
      const finalIban = (maskedIban === "Stripe Secured" && item.masked_iban && item.masked_iban !== "n/a")
        ? item.masked_iban
        : maskedIban;
      return {
        ...item,
        status: "active" as const,
        payment_method: paymentMethod,
        masked_iban: finalIban,
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
  const config = getServerConfig();
  if (config.databaseUrl) {
    const isDb = await ensureDbInitialized();
    const client = getSqlClient();
    if (!isDb || !client) {
      throw new Error("PostgreSQL database configured but connection or initialization failed.");
    }
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
