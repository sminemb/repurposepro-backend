import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  appName: "RepurposePro",
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: [env.corsOrigin],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  logger: {
    level: "error",
    log: (level, _message, ...args) => {
      const error = args.find((value): value is Error => value instanceof Error);

      logger.error(`Better Auth ${level} event`, error);
    },
  },
  onAPIError: {
    onError: (error) => {
      logger.error("Better Auth API error", error);
    },
  },
  advanced:
    env.nodeEnv === "production"
      ? {
          useSecureCookies: true,
        }
      : undefined,
  user: {
    additionalFields: {
      role: {
        type: ["admin", "creator", "editor"],
        required: false,
        defaultValue: "creator",
        input: false,
      },
    },
  },
});
