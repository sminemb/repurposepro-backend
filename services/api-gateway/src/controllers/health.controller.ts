import type { RequestHandler } from "express";

import { sendSuccess } from "../utils/response.js";

export const getHealth: RequestHandler = (_request, response) => {
  sendSuccess(response, "RepurposePro API Gateway is running", {
    service: "api-gateway",
    status: "healthy",
  });
};
