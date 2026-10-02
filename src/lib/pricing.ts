/**
 * Lensly Centralized Pricing & Subscription Plan Configuration
 *
 * Single source of truth for all pricing plans, commitments, inclusions,
 * replacement allowances, and annual calculations across Lensly.care.
 * All product and pricing UI across the platform is generated from this central configuration.
 */

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // in EUR
  annualPrice: number; // in EUR (minimum 12-month commitment)
  activationFee: number; // in EUR
  currency: string;
  currencySymbol: string;
  minimumTermMonths: number;
  replacementsPerYear: number;
  framesPerYear: number;
  shipping: string;
  includedServices: string[];
  eligibilityRules: string[];
  badge?: string;
  popular?: boolean;
  active: boolean;
}

/**
 * Calculates the exact financial commitment during the initial minimum contract term.
 */
export function calculateAnnualCommitment(monthlyPrice: number, minimumTermMonths: number = 12): number {
  return monthlyPrice * minimumTermMonths;
}

export const AVAILABLE_PLANS: PricingPlan[] = [
  {
    id: "lensly_care_standard",
    name: "Lensly Care Standard",
    description: "Der Rundum-Schutz für Einstärkengläser und Sonnenbrillen mit Sehstärke.",
    monthlyPrice: 29.0,
    annualPrice: calculateAnnualCommitment(29.0, 12), // €348.00 mathematical annual commitment
    activationFee: 0.0,
    currency: "EUR",
    currencySymbol: "€",
    minimumTermMonths: 12,
    replacementsPerYear: 3,
    framesPerYear: 1,
    shipping: "Kostenloser EU-Versand",
    badge: "Beliebt",
    popular: true,
    active: true,
    includedServices: [
      "1 complete frame of choice including premium single-vision lenses per contract year",
      "Up to 3 replacement requests per contract year for breakage, damage, or prescription change per plan terms",
      "Super anti-reflective, hard coating & UV-400 protection included",
      "Free feasibility check before any payment",
      "Free insured round-trip shipping within the EU",
      "Monthly cancelable after the 12-month minimum contract term",
    ],
    eligibilityRules: [
      "Sphäre: bis ±6.00 dpt",
      "Zylinder: bis ±2.00 dpt",
      "Mindestalter: 18 Jahre",
    ],
  },
  {
    id: "lensly_care_plus",
    name: "Lensly Care Plus (Gleitsicht)",
    description: "Maßgeschneiderte Gleitsicht- und Arbeitsplatzgläser mit erweitertem Schutz.",
    monthlyPrice: 49.0,
    annualPrice: calculateAnnualCommitment(49.0, 12), // €588.00 mathematical annual commitment
    activationFee: 0.0,
    currency: "EUR",
    currencySymbol: "€",
    minimumTermMonths: 12,
    replacementsPerYear: 4,
    framesPerYear: 1,
    shipping: "Kostenloser Express-Versand",
    badge: "Premium",
    popular: false,
    active: true,
    includedServices: [
      "1 Designerfassung inklusive digitaler Freiform-Gleitsichtgläser pro Vertragsjahr",
      "Bis zu 4 Ersatzanfragen pro Vertragsjahr (inkl. Sehschärfen-Nachjustierung) gemäß Tarifbedingungen",
      "Premium Blaulichtfilter & Schmutzabweisende Lotus-Versiegelung inklusive",
      "Fertigung und optische Zentrierung nach übermittelten Brillenwerten",
      "Priorisierte Express-Fertigung und optische Ausgangsprüfung",
      "Monatlich kündbar nach der vertraglichen Mindestlaufzeit von 12 Monaten",
    ],
    eligibilityRules: [
      "Gleitsicht- und Nahkomfortgläser",
      "Sphäre: bis ±8.00 dpt",
      "Zylinder: bis ±4.00 dpt",
      "Addition: bis +3.50 dpt",
    ],
  },
  {
    id: "lensly_vision_essential",
    name: "Lensly Vision Essential",
    description: "Kompakte Sehhilfen-Absicherung für preissensible Brillenträger.",
    monthlyPrice: 19.0,
    annualPrice: calculateAnnualCommitment(19.0, 12), // €228.00 mathematical annual commitment
    activationFee: 19.0,
    currency: "EUR",
    currencySymbol: "€",
    minimumTermMonths: 12,
    replacementsPerYear: 2,
    framesPerYear: 1,
    shipping: "Standardversand inklusive",
    badge: "Basis",
    popular: false,
    active: true,
    includedServices: [
      "1 klassische Einstärken-Korrekturbrille alle 24 Monate",
      "Bis zu 2 Ersatzanfragen pro Vertragsjahr bei Bruch gemäß Tarifbedingungen",
      "Basis-Entspiegelung & UV-Schutz",
      "Kostenfreie digitale Rezeptprüfung",
    ],
    eligibilityRules: [
      "Sphäre: bis ±4.00 dpt",
      "Zylinder: bis ±1.50 dpt",
    ],
  },
];

export const CURRENT_PLAN: PricingPlan = AVAILABLE_PLANS[0];

export function getActivePlans(): PricingPlan[] {
  return AVAILABLE_PLANS.filter((plan) => plan.active);
}

export function getPlanById(planId: string): PricingPlan {
  const found = AVAILABLE_PLANS.find((p) => p.id === planId);
  return found || CURRENT_PLAN;
}

/**
 * Calculates the total financial commitment for the minimum contract term.
 */
export function getAnnualTotal(plan: PricingPlan = CURRENT_PLAN): number {
  return plan.annualPrice;
}

/**
 * Returns human-readable contract commitment text.
 */
export function getContractCommitmentSummary(plan: PricingPlan = CURRENT_PLAN): string {
  return `${plan.minimumTermMonths} Monate Mindestvertragslaufzeit (${formatEur(plan.monthlyPrice)}/Monat = ${formatEur(plan.annualPrice)} Mindestverpflichtung im 1. Jahr), danach monatlich kündbar mit 30 Tagen Frist.`;
}

/**
 * Calculates the equivalent daily cost for perspective.
 */
export function getDailyEquivalent(plan: PricingPlan = CURRENT_PLAN): string {
  const daily = (plan.monthlyPrice * 12) / 365;
  return `€${daily.toFixed(2)}`;
}

/**
 * Formats a given amount in Euros.
 */
export function formatEur(amount: number): string {
  return `€${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

/**
 * Validates whether a replacement request is within the plan's annual allowance.
 */
export function checkReplacementAllowance(
  planId: string,
  currentUsedReplacements: number,
): { eligible: boolean; maxAllowed: number; remaining: number } {
  const plan = getPlanById(planId);
  const remaining = Math.max(0, plan.replacementsPerYear - currentUsedReplacements);
  return {
    eligible: remaining > 0,
    maxAllowed: plan.replacementsPerYear,
    remaining,
  };
}
