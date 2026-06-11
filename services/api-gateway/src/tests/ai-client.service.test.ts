import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import type {
  AiProcessVideoInput,
  AiProcessVideoResponse,
  AiServiceHealthResponse,
} from "../services/ai-client.service.js";

process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET ??= "repurposepro-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:5000";
process.env.ARCJET_KEY = "";

let checkAiServiceHealth: () => Promise<AiServiceHealthResponse>;
let processVideoWithAiService: (
  input: AiProcessVideoInput,
) => Promise<AiProcessVideoResponse>;

const createJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

beforeAll(async () => {
  const aiClient = await import("../services/ai-client.service.js");

  checkAiServiceHealth = aiClient.checkAiServiceHealth;
  processVideoWithAiService = aiClient.processVideoWithAiService;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI client service", () => {
  test("handles a successful AI service health response", async () => {
    const healthResponse: AiServiceHealthResponse = {
      success: true,
      message: "RepurposePro AI Service is running",
      data: {
        service: "ai-service",
        status: "healthy",
      },
    };
    const fetchMock = vi.fn(async (): Promise<Response> =>
      createJsonResponse(healthResponse),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(checkAiServiceHealth()).resolves.toEqual(healthResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/health$/),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  test("handles an unreachable AI service cleanly", async () => {
    const fetchMock = vi.fn(async (): Promise<Response> => {
      throw new TypeError("fetch failed");
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(checkAiServiceHealth()).rejects.toMatchObject({
      message: "AI service is unavailable",
      statusCode: 502,
    });
  });

  test("sends the FastAPI mock processing request contract", async () => {
    const input: AiProcessVideoInput = {
      jobId: "job-123",
      projectId: "project-123",
      originalVideoUrl: "uploads/project-123/source.mp4",
      requestedOutputs: ["summary", "reels"],
    };
    const processingResponse: AiProcessVideoResponse = {
      success: true,
      message: "Mock video processing completed",
      data: {
        summaryVideo: {
          type: "summary",
          title: "Generated Summary Video",
          outputUrl: "processed/project-123/summary.mp4",
          durationSeconds: 480,
          aspectRatio: "16:9",
        },
        reels: [
          {
            type: "reel",
            title: "Generated Reel 1",
            outputUrl: "processed/project-123/reel-1.mp4",
            durationSeconds: 45,
            aspectRatio: "9:16",
          },
        ],
      },
    };
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit): Promise<Response> =>
        createJsonResponse(processingResponse),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(processVideoWithAiService(input)).resolves.toEqual(
      processingResponse,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/process-video$/),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),
    );
  });

  test("rejects unsafe or inconsistent generated video output", async () => {
    const input: AiProcessVideoInput = {
      jobId: "job-123",
      projectId: "project-123",
      originalVideoUrl: "uploads/project-123/source.mp4",
      requestedOutputs: ["summary", "reels"],
    };
    const fetchMock = vi.fn(async (): Promise<Response> =>
      createJsonResponse({
        success: true,
        message: "Mock video processing completed",
        data: {
          summaryVideo: {
            type: "summary",
            title: "Generated Summary Video",
            outputUrl: "../outside/summary.mp4",
            durationSeconds: 480,
            aspectRatio: "16:9",
          },
          reels: [
            {
              type: "summary",
              title: "Wrong output type",
              outputUrl: "processed/project-123/reel-1.mp4",
              durationSeconds: 45,
              aspectRatio: "9:16",
            },
          ],
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(processVideoWithAiService(input)).rejects.toMatchObject({
      message: "AI service returned an invalid processing response",
      statusCode: 502,
    });
  });
});
