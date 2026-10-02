import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getSqlClient, ensureDbInitialized, recordAuditLogServer } from "./subscriptions.server";
import { getDataFilePath } from "./data-dir.server";

export type OpticianPartnerType = "verified_partner" | "pending_partner" | "directory_listing" | "demo_test";

export interface OpticianPartner {
  id: string;
  business_name: string;
  city: string;
  postal_code: string;
  street_address: string;
  country: string;
  phone: string;
  email: string;
  services: string[];
  appointment_url?: string;
  customer_measurement_support: boolean;
  active: boolean;
  partner_type: OpticianPartnerType;
  notes?: string;
}

export const SEED_OPTICIAN_PARTNERS: OpticianPartner[] = [
  {
    id: "partner-berlin-mitte",
    business_name: "Sehwerkstatt Berlin Mitte",
    city: "Berlin",
    postal_code: "10117",
    street_address: "Friedrichstraße 185",
    country: "Deutschland",
    phone: "+49 30 2064 8920",
    email: "berlin@sehwerkstatt-partner.de",
    services: ["Augenprüfung & Refraktion", "Zentrierdatenerfassung", "Brillenanpassung & Sitzprüfung"],
    appointment_url: "https://sehwerkstatt-partner.de/termin-berlin",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
  {
    id: "partner-muenchen-altstadt",
    business_name: "Optik am Sendlinger Tor",
    city: "München",
    postal_code: "80336",
    street_address: "Sendlinger-Tor-Platz 7",
    country: "Deutschland",
    phone: "+49 89 5994 3820",
    email: "service@optik-sendlingertor.de",
    services: ["Digitale 3D-Augenvermessung", "Gleitsicht-Zentrierung", "Ultraschall-Reinigung"],
    appointment_url: "https://optik-sendlingertor.de/lensly",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
  {
    id: "partner-hamburg-neustadt",
    business_name: "Hanseatische Brillen-Manufaktur",
    city: "Hamburg",
    postal_code: "20354",
    street_address: "Neuer Wall 42",
    country: "Deutschland",
    phone: "+49 40 3609 1140",
    email: "moin@hanse-brillen.de",
    services: ["Komplette Sehstärkenbestimmung", "Fassungsberatung", "Pupillendistanzmessung (PD)"],
    appointment_url: "https://hanse-brillen.de/lensly-care",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
  {
    id: "partner-koeln-innenstadt",
    business_name: "Optik Forum Köln",
    city: "Köln",
    postal_code: "50667",
    street_address: "Schildergasse 84",
    country: "Deutschland",
    phone: "+49 221 2728 9010",
    email: "info@optikforum-koeln.de",
    services: ["Refraktion & Sehtest", "Brilleninspektion", "Gleitsichtglasberatung"],
    appointment_url: "https://optikforum-koeln.de/online-termin",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
  {
    id: "partner-frankfurt-westend",
    business_name: "Skyline Optik Frankfurt",
    city: "Frankfurt am Main",
    postal_code: "60325",
    street_address: "Bockenheimer Landstraße 51",
    country: "Deutschland",
    phone: "+49 69 9778 4500",
    email: "praxis@skyline-optik.de",
    services: ["Präzisions-Sehtest", "Hornhauttopographie", "Individuelle Anpassung"],
    appointment_url: "https://skyline-optik.de/termin",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
  {
    id: "partner-stuttgart-mitte",
    business_name: "Augenoptik Königstraße",
    city: "Stuttgart",
    postal_code: "70173",
    street_address: "Königstraße 26",
    country: "Deutschland",
    phone: "+49 711 2293 8410",
    email: "termin@optik-koenigstrasse.de",
    services: ["Sehstärkenanalyse", "Brillenglasberatung", "Fassungs-Ergonomie"],
    appointment_url: "https://optik-koenigstrasse.de/lensly",
    customer_measurement_support: true,
    active: true,
    partner_type: "demo_test",
    notes: "Technischer Demo-Eintrag zur Veranschaulichung der Standortsuche. Noch kein bestätigter Lensly-Partner.",
  },
];

const PARTNERS_FILE_PATH = getDataFilePath("optician_partners.json");

async function readPartnersJson(): Promise<OpticianPartner[]> {
  try {
    const raw = await fs.readFile(PARTNERS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => ({
        ...p,
        partner_type: p.partner_type || "demo_test",
      }));
    }
  } catch {}

  // Initialize with seed data
  await fs.writeFile(PARTNERS_FILE_PATH, JSON.stringify(SEED_OPTICIAN_PARTNERS, null, 2), "utf-8");
  return [...SEED_OPTICIAN_PARTNERS];
}

async function writePartnersJson(partners: OpticianPartner[]): Promise<void> {
  try {
    await fs.writeFile(PARTNERS_FILE_PATH, JSON.stringify(partners, null, 2), "utf-8");
  } catch (err) {
    console.error("[Partners] Failed to write optician_partners.json:", err);
  }
}

export async function getOpticianPartnersServer(
  options: boolean | { activeOnly?: boolean; city?: string; postalCode?: string } = true,
): Promise<OpticianPartner[]> {
  const activeOnly = typeof options === "boolean" ? options : (options?.activeOnly ?? true);
  const cityFilter = typeof options === "object" ? options.city?.trim().toLowerCase() : undefined;
  const postalFilter = typeof options === "object" ? options.postalCode?.trim() : undefined;
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      await client`
        CREATE TABLE IF NOT EXISTS optician_partners (
          id VARCHAR(100) PRIMARY KEY,
          business_name VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          street_address VARCHAR(255) NOT NULL,
          country VARCHAR(100) DEFAULT 'Deutschland' NOT NULL,
          phone VARCHAR(50),
          email VARCHAR(255),
          services JSONB DEFAULT '[]'::jsonb NOT NULL,
          appointment_url TEXT,
          customer_measurement_support BOOLEAN DEFAULT TRUE NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          partner_type VARCHAR(50) DEFAULT 'demo_test' NOT NULL,
          notes TEXT
        )
      `;

      let rows;
      if (activeOnly) {
        rows = await client`SELECT * FROM optician_partners WHERE active = TRUE ORDER BY city ASC`;
      } else {
        rows = await client`SELECT * FROM optician_partners ORDER BY city ASC`;
      }

      if (rows && rows.length > 0) {
        let result = rows as unknown as OpticianPartner[];
        if (cityFilter) result = result.filter((p) => p.city.toLowerCase().includes(cityFilter));
        if (postalFilter) result = result.filter((p) => p.postal_code.includes(postalFilter));
        return result;
      }
    } catch (err) {
      console.error("[Partners] PostgreSQL query failed, using JSON fallback:", err);
    }
  }

  let list = await readPartnersJson();
  if (activeOnly) list = list.filter((p) => p.active);
  if (cityFilter) list = list.filter((p) => p.city.toLowerCase().includes(cityFilter));
  if (postalFilter) list = list.filter((p) => p.postal_code.includes(postalFilter));
  return list;
}

const CITY_ALIASES: Record<string, string> = {
  munich: "münchen",
  cologne: "köln",
  nuremberg: "nürnberg",
  vienna: "wien",
};

export async function searchOpticianPartnersServer(query: string): Promise<OpticianPartner[]> {
  const all = await getOpticianPartnersServer(true);
  if (!query || query.trim().length === 0) return all;

  const normalized = query.trim().toLowerCase();
  const alias = CITY_ALIASES[normalized] || normalized;
  const isZipQuery = /^\d+$/.test(normalized);

  return all.filter((p) => {
    const city = p.city.toLowerCase();
    const postal = p.postal_code.toLowerCase();
    const name = p.business_name.toLowerCase();
    const address = p.street_address.toLowerCase();

    if (city.includes(normalized) || city.includes(alias)) return true;
    if (name.includes(normalized) || address.includes(normalized)) return true;
    if (postal.includes(normalized)) return true;
    // If it's a 3+ digit German PLZ search (e.g. 80333 vs 80336), match postal code region prefix
    if (isZipQuery && normalized.length >= 3 && postal.startsWith(normalized.slice(0, 3))) return true;

    return false;
  });
}

export async function updateOpticianPartnerServer(
  partner: OpticianPartner,
  adminId: string = "admin",
): Promise<OpticianPartner> {
  const isDb = await ensureDbInitialized();
  const client = getSqlClient();

  if (isDb && client) {
    try {
      await client`
        INSERT INTO optician_partners (
          id, business_name, city, postal_code, street_address, country,
          phone, email, services, appointment_url, customer_measurement_support, active, partner_type, notes
        ) VALUES (
          ${partner.id},
          ${partner.business_name},
          ${partner.city},
          ${partner.postal_code},
          ${partner.street_address},
          ${partner.country},
          ${partner.phone},
          ${partner.email},
          ${JSON.stringify(partner.services)},
          ${partner.appointment_url ?? null},
          ${partner.customer_measurement_support},
          ${partner.active},
          ${partner.partner_type || "demo_test"},
          ${partner.notes ?? null}
        )
        ON CONFLICT (id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          city = EXCLUDED.city,
          postal_code = EXCLUDED.postal_code,
          street_address = EXCLUDED.street_address,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          services = EXCLUDED.services,
          appointment_url = EXCLUDED.appointment_url,
          customer_measurement_support = EXCLUDED.customer_measurement_support,
          active = EXCLUDED.active,
          partner_type = EXCLUDED.partner_type,
          notes = EXCLUDED.notes
      `;
    } catch (err) {
      console.error("[Partners] PostgreSQL update partner failed:", err);
    }
  }

  const list = await readPartnersJson();
  const index = list.findIndex((p) => p.id === partner.id);
  if (index !== -1) {
    list[index] = partner;
  } else {
    list.push(partner);
  }
  await writePartnersJson(list);

  await recordAuditLogServer({
    request_id: partner.id,
    admin_id: adminId,
    action: "OPTICIAN_PARTNER_UPDATED",
    metadata: `Partner: ${partner.business_name}, Active: ${partner.active}`,
  }).catch(() => {});

  return partner;
}
