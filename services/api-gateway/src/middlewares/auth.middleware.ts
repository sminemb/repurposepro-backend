import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";
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
