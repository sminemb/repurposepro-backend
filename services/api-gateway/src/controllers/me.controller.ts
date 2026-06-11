import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const getMe: RequestHandler = (request, response) => {
  getAuthenticatedUserId(request);

  sendSuccess(
    response,
    "Authenticated user retrieved successfully",
    {
      user: request.auth?.user,
    },
  );
};
