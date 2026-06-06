import type { ErrorRequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    sendError(response, error.message, error.errors, error.statusCode);
    return;
  }

  logger.error("Unhandled request error", error);

  sendError(
    response,
    env.nodeEnv === "production" ? "Internal server error" : error.message,
  );
};
