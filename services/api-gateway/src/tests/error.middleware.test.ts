import type { NextFunction, Request, Response } from "express";
import { describe, expect, test, vi } from "vitest";

import { errorMiddleware } from "../middlewares/error.middleware.js";

describe("error middleware", () => {
  test("does not expose unknown internal error messages", () => {
    const status = vi.fn();
    const json = vi.fn();
    const response = {
      status,
      json,
    } as unknown as Response;

    status.mockReturnValue(response);

    errorMiddleware(
      new Error("sensitive database connection detail"),
      {} as Request,
      response,
      (() => undefined) as NextFunction,
    );

    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  });
});
