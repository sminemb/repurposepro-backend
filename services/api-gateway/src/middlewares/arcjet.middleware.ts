import type { ArcjetDecision } from "@arcjet/node";
import type { RequestHandler } from "express";

import {
  authArcjet,
  generalApiArcjet,
  isArcjetConfigured,
  processingArcjet,
  uploadArcjet,
} from "../lib/arcjet.js";
import { sendError } from "../utils/response.js";

interface ArcjetClient {
  protect: (request: Parameters<RequestHandler>[0]) => Promise<ArcjetDecision>;
}

const getDeniedResponse = (
  decision: ArcjetDecision,
): { message: string; statusCode: number } => {
  if (decision.reason.isRateLimit()) {
    return {
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    };
  }

  return {
    message: "Request blocked by API protection.",
    statusCode: 403,
  };
};

const createArcjetMiddleware =
  (client: ArcjetClient | undefined): RequestHandler =>
  async (request, response, next) => {
    if (!isArcjetConfigured || client === undefined) {
      next();
      return;
    }

    try {
      const decision = await client.protect(request);

      if (decision.isDenied()) {
        const { message, statusCode } = getDeniedResponse(decision);
        sendError(response, message, [], statusCode);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const generalApiProtection = createArcjetMiddleware(generalApiArcjet);
export const authProtection = createArcjetMiddleware(authArcjet);
export const uploadProtection = createArcjetMiddleware(uploadArcjet);
export const processingProtection = createArcjetMiddleware(processingArcjet);
