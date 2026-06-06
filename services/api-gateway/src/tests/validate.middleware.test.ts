import assert from "node:assert/strict";
import test from "node:test";

import type { NextFunction, Request, Response } from "express";

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
    assert.equal(error, undefined);
    nextCalled = true;
  };

  assert.doesNotThrow(() => {
    validate({
      query: listProjectJobsQuerySchema,
    })(request, response, next);
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(request.validatedQuery, {
    status: "queued",
  });
});
