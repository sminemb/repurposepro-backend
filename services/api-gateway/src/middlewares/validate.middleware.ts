import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { ZodIssue, ZodType } from "zod";

import { sendError } from "../utils/response.js";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

const formatIssues = (issues: ZodIssue[]) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (request, response, next) => {
    if (schemas.body !== undefined) {
      const result = schemas.body.safeParse(request.body);

      if (!result.success) {
        sendError(response, "Validation failed", formatIssues(result.error.issues), 400);
        return;
      }

      request.body = result.data;
    }

    if (schemas.params !== undefined) {
      const result = schemas.params.safeParse(request.params);

      if (!result.success) {
        sendError(response, "Validation failed", formatIssues(result.error.issues), 400);
        return;
      }

      request.params = result.data as ParamsDictionary;
    }

    if (schemas.query !== undefined) {
      const result = schemas.query.safeParse(request.query);

      if (!result.success) {
        sendError(response, "Validation failed", formatIssues(result.error.issues), 400);
        return;
      }

      request.validatedQuery = result.data as ParsedQs;
    }

    next();
  };
