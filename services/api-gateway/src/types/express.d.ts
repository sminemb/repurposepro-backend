import type { UserRole } from "@prisma/client";
import type { auth } from "../lib/auth.js";

type BetterAuthSession = typeof auth.$Infer.Session;
type AuthenticatedSession = BetterAuthSession & {
  user: BetterAuthSession["user"] & {
    role?: UserRole | null;
  };
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedSession;
      validatedQuery?: unknown;
    }
  }
}

export {};
