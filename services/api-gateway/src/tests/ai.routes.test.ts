import express, { type Express } from "express";
import supertest from "supertest";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET ??= "repurposepro-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:5000";
process.env.ARCJET_KEY = "";

vi.mock("../middlewares/auth.middleware.js", () => ({
  requireAuth: (
    _request: unknown,
    _response: unknown,
    next: (error?: unknown) => void,
  ) => {
    next();
  },
}));

let app: Express;

beforeAll(async () => {
  const [{ aiRouter }, { errorMiddleware }] = await Promise.all([
    import("../routes/ai.routes.js"),
    import("../middlewares/error.middleware.js"),
  ]);

  app = express();
  app.use("/api/internal/ai", aiRouter);
  app.use(errorMiddleware);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("GET /api/internal/ai/health returns a controlled unavailable response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (): Promise<Response> => {
      throw new TypeError("fetch failed");
    }),
  );

  const response = await supertest(app)
    .get("/api/internal/ai/health")
    .expect(502);

  expect(response.body).toEqual({
    success: false,
    message: "AI service is unavailable",
    errors: [],
  });
});
