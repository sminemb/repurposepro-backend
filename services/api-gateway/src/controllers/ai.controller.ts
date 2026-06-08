import type { RequestHandler } from "express";

import { checkAiServiceHealth } from "../services/ai-client.service.js";
import { sendSuccess } from "../utils/response.js";

export const getAiServiceHealthController: RequestHandler = async (
  _request,
  response,
  next,
) => {
  try {
    const health = await checkAiServiceHealth();

    sendSuccess(response, "AI service health retrieved successfully", health);
  } catch (error) {
    next(error);
  }
};
