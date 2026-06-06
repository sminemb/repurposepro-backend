import type { RequestHandler } from "express";

import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export const getMe: RequestHandler = (request, response) => {
  if (request.auth === undefined) {
    throw new AppError("Authentication required", 401);
  }

  sendSuccess(
    response,
    "Authenticated user retrieved successfully",
    request.auth,
  );
};
