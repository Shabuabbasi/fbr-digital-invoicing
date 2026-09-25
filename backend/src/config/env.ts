import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  mongodbUri: required("MONGODB_URI", "mongodb://localhost:27017/intelgency_invoicing"),

  jwtSecret:
    process.env.NODE_ENV === "production"
      ? required("JWT_SECRET")
      : (process.env.JWT_SECRET || "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  fbr: {
    apiBaseUrl: process.env.FBR_API_BASE_URL ?? "",
    apiToken: process.env.FBR_API_TOKEN ?? "",
    environment: (process.env.FBR_ENVIRONMENT ?? "SANDBOX") as "SANDBOX" | "PRODUCTION",
    timeoutMs: Number(process.env.FBR_API_TIMEOUT_MS ?? 15000),
    // An invoice left in SUBMITTING longer than this (e.g. server crashed mid-request) is moved
    // to RECONCILIATION_REQUIRED — never resubmitted. See fbr.recovery.ts.
    submittingStaleAfterMs: Number(process.env.FBR_SUBMITTING_STALE_AFTER_MS ?? 5 * 60 * 1000),
    staleCheckIntervalMs: Number(process.env.FBR_STALE_CHECK_INTERVAL_MS ?? 60 * 1000),
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
    companyName: process.env.SEED_COMPANY_NAME ?? "Sample Company",
  },
};

export const isProduction = env.nodeEnv === "production";
