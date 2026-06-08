import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export type AiRequestedOutput = "summary" | "reels";
export type AiGeneratedVideoType = "summary" | "reel";

export interface AiProcessVideoInput {
  jobId: string;
  projectId: string;
  originalVideoUrl: string;
  requestedOutputs: AiRequestedOutput[];
}

export interface AiGeneratedVideoOutput {
  type: AiGeneratedVideoType;
  title: string;
  outputUrl: string;
  durationSeconds: number;
  aspectRatio: string;
}

export interface AiProcessVideoResponse {
  success: boolean;
  message: string;
  data: {
    summaryVideo: AiGeneratedVideoOutput;
    reels: AiGeneratedVideoOutput[];
  };
}

export interface AiServiceHealthResponse {
  success: boolean;
  message: string;
  data: {
    service: string;
    status: string;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGeneratedVideoOutput = (
  value: unknown,
): value is AiGeneratedVideoOutput =>
  isRecord(value) &&
  (value.type === "summary" || value.type === "reel") &&
  typeof value.title === "string" &&
  typeof value.outputUrl === "string" &&
  typeof value.durationSeconds === "number" &&
  typeof value.aspectRatio === "string";

const isProcessVideoResponse = (
  value: unknown,
): value is AiProcessVideoResponse =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  typeof value.message === "string" &&
  isRecord(value.data) &&
  isGeneratedVideoOutput(value.data.summaryVideo) &&
  Array.isArray(value.data.reels) &&
  value.data.reels.every(isGeneratedVideoOutput);

const isHealthResponse = (value: unknown): value is AiServiceHealthResponse =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  typeof value.message === "string" &&
  isRecord(value.data) &&
  typeof value.data.service === "string" &&
  typeof value.data.status === "string";

const getAiServiceUrl = (path: string): string =>
  `${env.aiServiceUrl.replace(/\/+$/, "")}${path}`;

const requestAiService = async (
  path: string,
  init: RequestInit,
): Promise<unknown> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.aiServiceTimeoutMs);

  try {
    const response = await fetch(getAiServiceUrl(path), {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError(
        `AI service request failed with status ${response.status}`,
        502,
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new AppError("AI service returned an invalid JSON response", 502);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new AppError("AI service request timed out", 504);
    }

    throw new AppError("AI service is unavailable", 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const checkAiServiceHealth =
  async (): Promise<AiServiceHealthResponse> => {
    const response = await requestAiService("/health", {
      method: "GET",
    });

    if (
      !isHealthResponse(response) ||
      !response.success ||
      response.data.status !== "healthy"
    ) {
      throw new AppError("AI service is unhealthy", 502);
    }

    return response;
  };

export const processVideoWithAiService = async (
  input: AiProcessVideoInput,
): Promise<AiProcessVideoResponse> => {
  const response = await requestAiService("/process-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!isProcessVideoResponse(response)) {
    throw new AppError("AI service returned an invalid processing response", 502);
  }

  if (!response.success) {
    throw new AppError("AI service failed to process video", 502);
  }

  return response;
};
