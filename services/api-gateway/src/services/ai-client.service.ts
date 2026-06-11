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

const isBoundedString = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= maxLength;

const isSafeRelativeAssetPath = (value: unknown): value is string => {
  if (
    !isBoundedString(value, 2_048) ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    return false;
  }

  const segments = value.split("/");

  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== "..",
  );
};

const isGeneratedVideoOutput = (
  value: unknown,
): value is AiGeneratedVideoOutput =>
  isRecord(value) &&
  (value.type === "summary" || value.type === "reel") &&
  isBoundedString(value.title, 200) &&
  isSafeRelativeAssetPath(value.outputUrl) &&
  value.outputUrl.endsWith(".mp4") &&
  Number.isInteger(value.durationSeconds) &&
  (value.durationSeconds as number) > 0 &&
  (value.durationSeconds as number) <= 7_200 &&
  (value.aspectRatio === "16:9" || value.aspectRatio === "9:16");

const isProcessVideoResponse = (
  value: unknown,
  projectId: string,
): value is AiProcessVideoResponse =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  isBoundedString(value.message, 500) &&
  isRecord(value.data) &&
  isGeneratedVideoOutput(value.data.summaryVideo) &&
  value.data.summaryVideo.type === "summary" &&
  value.data.summaryVideo.aspectRatio === "16:9" &&
  value.data.summaryVideo.outputUrl.startsWith(`processed/${projectId}/`) &&
  Array.isArray(value.data.reels) &&
  value.data.reels.length > 0 &&
  value.data.reels.length <= 100 &&
  value.data.reels.every(
    (output) =>
      isGeneratedVideoOutput(output) &&
      output.type === "reel" &&
      output.aspectRatio === "9:16" &&
      output.outputUrl.startsWith(`processed/${projectId}/`),
  );

const isHealthResponse = (value: unknown): value is AiServiceHealthResponse =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  isBoundedString(value.message, 500) &&
  isRecord(value.data) &&
  isBoundedString(value.data.service, 100) &&
  isBoundedString(value.data.status, 100);

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
      headers:
        env.aiServiceApiKey === undefined
          ? undefined
          : {
              "X-Internal-API-Key": env.aiServiceApiKey,
            },
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
      ...(env.aiServiceApiKey === undefined
        ? {}
        : {
            "X-Internal-API-Key": env.aiServiceApiKey,
          }),
    },
    body: JSON.stringify(input),
  });

  if (!isProcessVideoResponse(response, input.projectId)) {
    throw new AppError("AI service returned an invalid processing response", 502);
  }

  if (!response.success) {
    throw new AppError("AI service failed to process video", 502);
  }

  return response;
};
