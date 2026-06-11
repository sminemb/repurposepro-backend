import type { RequestHandler } from "express";
import type { Request } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (authSession === null) {
      sendError(response, "Authentication required", [], 401);
      return;
    }

    request.auth = authSession;
    next();
  } catch (error) {
    next(error);
  }
};

export const getAuthenticatedUserId = (request: Request): string => {
  if (request.auth === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.auth.user.id;
};
