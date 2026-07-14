import process from "node:process";

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePriceId: process.env.STRIPE_PRICE_ID,
    adminPassword: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD_HASH,
  };
}
