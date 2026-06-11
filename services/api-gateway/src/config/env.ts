import "dotenv/config";
import path from "node:path";

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

const parseHttpUrl = (name: string, value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP or HTTPS URL`);
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error(`${name} must be a valid HTTP or HTTPS URL without credentials`);
  }

  return value.replace(/\/+$/, "");
};

const parseCorsOrigin = (value: string | undefined): string => {
  const origin = parseHttpUrl("CORS_ORIGIN", value?.trim() || "http://localhost:3000");
  const url = new URL(origin);

  if (origin === "*" || origin !== url.origin) {
    throw new Error("CORS_ORIGIN must be a single explicit origin");
  }

  return origin;
};

const parseUploadDir = (value: string | undefined): string => {
  const configuredPath = value?.trim() || DEFAULT_UPLOAD_DIR;
  const serviceRoot = process.cwd();
  const resolvedPath = path.resolve(serviceRoot, configuredPath);
  const relativePath = path.relative(serviceRoot, resolvedPath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("UPLOAD_DIR must resolve within the API Gateway service directory");
  }

  return configuredPath;
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
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const aiServiceApiKey = optionalEnv("AI_SERVICE_API_KEY");

if ((nodeEnv === "production" || arcjetEnv === "production") && arcjetKey === undefined) {
  throw new Error("ARCJET_KEY must be configured in production");
}

if (nodeEnv === "production" && betterAuthSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
}

if (
  nodeEnv === "production" &&
  (aiServiceApiKey === undefined || aiServiceApiKey.length < 32)
) {
  throw new Error("AI_SERVICE_API_KEY must be at least 32 characters in production");
}

export const env = {
  port: parsePort(process.env.PORT),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  nodeEnv,
  betterAuthSecret,
  betterAuthUrl: parseHttpUrl("BETTER_AUTH_URL", requireEnv("BETTER_AUTH_URL")),
  arcjetKey,
  arcjetEnv,
  uploadDir: parseUploadDir(process.env.UPLOAD_DIR),
  maxUploadSizeMb: parsePositiveInteger(
    "MAX_UPLOAD_SIZE_MB",
    process.env.MAX_UPLOAD_SIZE_MB,
    DEFAULT_MAX_UPLOAD_SIZE_MB,
  ),
  aiServiceUrl: parseHttpUrl(
    "AI_SERVICE_URL",
    process.env.AI_SERVICE_URL?.trim() || DEFAULT_AI_SERVICE_URL,
  ),
  aiServiceApiKey,
  aiServiceTimeoutMs: parsePositiveInteger(
    "AI_SERVICE_TIMEOUT_MS",
    process.env.AI_SERVICE_TIMEOUT_MS,
    DEFAULT_AI_SERVICE_TIMEOUT_MS,
  ),
} as const;
