import type { NextFunction, Request, Response } from "express";
import { expect, test } from "vitest";

import { validate } from "../middlewares/validate.middleware.js";
import { listProjectJobsQuerySchema } from "../validators/job.validator.js";

test("validates an Express 5 getter-only query without assigning to it", () => {
  const request = {} as Request;
  const response = {} as Response;
  let nextCalled = false;

  Object.defineProperty(request, "query", {
    configurable: true,
    enumerable: true,
    get: () => ({
      status: "queued",
    }),
  });

  const next: NextFunction = (error?: unknown) => {
    expect(error).toBeUndefined();
    nextCalled = true;
  };

  expect(() => {
    validate({
      query: listProjectJobsQuerySchema,
    })(request, response, next);
  }).not.toThrow();

  expect(nextCalled).toBe(true);
  expect(request.validatedQuery).toEqual({
    status: "queued",
  });
});
