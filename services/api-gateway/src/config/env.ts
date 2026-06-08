import "dotenv/config";

const DEFAULT_PORT = 5000;
const DEFAULT_UPLOAD_DIR = "storage/uploads";
const DEFAULT_MAX_UPLOAD_SIZE_MB = 2048;
const DEFAULT_AI_SERVICE_URL = "http://localhost:8000";
const DEFAULT_AI_SERVICE_TIMEOUT_MS = 30_000;

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (value === undefined || value.length === 0) {
    throw new Error(`${name} must be configured`);
  }

  return value;
};

const parsePort = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
};

const parsePositiveInteger = (
  name: string,
  value: string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined || value.trim().length === 0) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
};

const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();

  return value === undefined || value.length === 0 ? undefined : value;
};

const parseArcjetEnv = (value: string | undefined): "development" | "production" => {
  if (value === undefined || value.length === 0) {
    return "development";
  }

  if (value !== "development" && value !== "production") {
    throw new Error("ARCJET_ENV must be either development or production");
  }

  return value;
};

const arcjetKey = optionalEnv("ARCJET_KEY");
const arcjetEnv = parseArcjetEnv(process.env.ARCJET_ENV);
const nodeEnv = process.env.NODE_ENV ?? "development";

if ((nodeEnv === "production" || arcjetEnv === "production") && arcjetKey === undefined) {
  throw new Error("ARCJET_KEY must be configured in production");
}

export const env = {
  port: parsePort(process.env.PORT),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  nodeEnv,
  betterAuthSecret: requireEnv("BETTER_AUTH_SECRET"),
  betterAuthUrl: requireEnv("BETTER_AUTH_URL"),
  arcjetKey,
  arcjetEnv,
  uploadDir: process.env.UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_DIR,
  maxUploadSizeMb: parsePositiveInteger(
    "MAX_UPLOAD_SIZE_MB",
    process.env.MAX_UPLOAD_SIZE_MB,
    DEFAULT_MAX_UPLOAD_SIZE_MB,
  ),
  aiServiceUrl: process.env.AI_SERVICE_URL?.trim() || DEFAULT_AI_SERVICE_URL,
  aiServiceTimeoutMs: parsePositiveInteger(
    "AI_SERVICE_TIMEOUT_MS",
    process.env.AI_SERVICE_TIMEOUT_MS,
    DEFAULT_AI_SERVICE_TIMEOUT_MS,
  ),
} as const;
