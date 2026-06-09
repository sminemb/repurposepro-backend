import "dotenv/config";

import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";
import type { Express } from "express";
import supertest, {
  type Response as SupertestResponse,
  type Test as SupertestTest,
} from "supertest";
import { expect, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.ARCJET_KEY = "";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ProjectData {
  id: string;
  title: string;
  status: string;
  originalVideoUrl: string | null;
}

export interface JobData {
  id: string;
  projectId: string;
  status: string;
  progress: number;
  currentStep: string | null;
}

export const INTEGRATION_TEST_TIMEOUT_MS = 60_000;

interface CreateHarnessOptions {
  name: string;
  aiProcessingDelayMs?: number;
}

const nativeFetch = globalThis.fetch;

export const delay = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

class AiProcessingGate {
  private paused = false;
  private readonly waiters = new Set<() => void>();

  public pause(): void {
    this.paused = true;
  }

  public release(): void {
    this.paused = false;

    for (const resolve of this.waiters) {
      resolve();
    }

    this.waiters.clear();
  }

  public async wait(defaultDelayMs: number): Promise<void> {
    if (!this.paused) {
      await delay(defaultDelayMs);
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.add(resolve);
    });
  }
}

const createFastApiMock =
  (processingGate: AiProcessingGate, processingDelayMs: number) =>
  async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (!url.endsWith("/process-video")) {
      return nativeFetch(input, init);
    }

    const payload = JSON.parse(String(init?.body)) as {
      projectId: string;
    };

    await processingGate.wait(processingDelayMs);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mock video processing completed",
        data: {
          summaryVideo: {
            type: "summary",
            title: "Generated Summary Video",
            outputUrl: `processed/${payload.projectId}/summary.mp4`,
            durationSeconds: 480,
            aspectRatio: "16:9",
          },
          reels: [
            {
              type: "reel",
              title: "Generated Reel 1",
              outputUrl: `processed/${payload.projectId}/reel-1.mp4`,
              durationSeconds: 45,
              aspectRatio: "9:16",
            },
          ],
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  };

export class ApiTestHarness {
  public readonly app: Express;
  public readonly prisma: PrismaClient;
  public readonly trustedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  public readonly email: string;
  public readonly password: string;
  public readonly aiProcessingDelayMs: number;
  public agent: ReturnType<typeof supertest.agent>;

  private readonly aiProcessingGate: AiProcessingGate;
  private readonly uploadedVideoPaths = new Set<string>();

  private constructor(
    app: Express,
    prisma: PrismaClient,
    options: Required<CreateHarnessOptions>,
    aiProcessingGate: AiProcessingGate,
  ) {
    const testId = randomUUID();

    this.app = app;
    this.prisma = prisma;
    this.agent = supertest.agent(app);
    this.email = `${options.name}-${testId}@example.com`;
    this.password = `Test-${testId}-Aa1!`;
    this.aiProcessingDelayMs = options.aiProcessingDelayMs;
    this.aiProcessingGate = aiProcessingGate;
  }

  public static async create(
    options: CreateHarnessOptions,
  ): Promise<ApiTestHarness> {
    const resolvedOptions = {
      name: options.name,
      aiProcessingDelayMs: options.aiProcessingDelayMs ?? 2_000,
    };
    const aiProcessingGate = new AiProcessingGate();

    vi.stubGlobal(
      "fetch",
      vi.fn(
        createFastApiMock(
          aiProcessingGate,
          resolvedOptions.aiProcessingDelayMs,
        ),
      ),
    );

    const [{ app }, { prisma }] = await Promise.all([
      import("../../app.js"),
      import("../../lib/prisma.js"),
    ]);

    return new ApiTestHarness(app, prisma, resolvedOptions, aiProcessingGate);
  }

  public pauseAiProcessing(): void {
    this.aiProcessingGate.pause();
  }

  public releaseAiProcessing(): void {
    this.aiProcessingGate.release();
  }

  public async expectAuthenticatedRequest(
    createRequest: () => SupertestTest,
    expectedStatus: number,
  ): Promise<SupertestResponse> {
    let response = await createRequest();

    for (let attempt = 1; attempt < 4; attempt += 1) {
      if (
        response.status !== 500 ||
        response.body.message !== "Failed to get session"
      ) {
        break;
      }

      await delay(1_500);
      response = await createRequest();
    }

    expect(response.status, JSON.stringify(response.body)).toBe(expectedStatus);
    return response;
  }

  public async signUpAndSignIn(): Promise<void> {
    await this.agent
      .post("/api/auth/sign-up/email")
      .set("Origin", this.trustedOrigin)
      .send({
        name: "RepurposePro Integration Test",
        email: this.email,
        password: this.password,
      })
      .expect(200);

    this.agent = supertest.agent(this.app);

    await this.agent
      .post("/api/auth/sign-in/email")
      .set("Origin", this.trustedOrigin)
      .send({
        email: this.email,
        password: this.password,
      })
      .expect(200);
  }

  public async createProject(title: string): Promise<ProjectData> {
    const response = await this.expectAuthenticatedRequest(
      () =>
        this.agent.post("/api/projects").set("Origin", this.trustedOrigin).send({
          title,
          description: "Created by the RepurposePro integration test",
          language: "en",
        }),
      201,
    );

    return (response.body as ApiSuccess<ProjectData>).data;
  }

  public async uploadProjectVideo(projectId: string): Promise<ProjectData> {
    const response = await this.expectAuthenticatedRequest(
      () =>
        this.agent
          .post(`/api/projects/${projectId}/upload`)
          .set("Origin", this.trustedOrigin)
          .attach(
            "video",
            Buffer.from("RepurposePro integration test video"),
            {
              filename: "integration-test.mp4",
              contentType: "video/mp4",
            },
          ),
      200,
    );
    const project = (response.body as ApiSuccess<ProjectData>).data;

    if (project.originalVideoUrl !== null) {
      this.uploadedVideoPaths.add(project.originalVideoUrl);
    }

    return project;
  }

  public async getJob(jobId: string): Promise<JobData> {
    const response = await this.expectAuthenticatedRequest(
      () =>
        this.agent.get(`/api/jobs/${jobId}`).set("Origin", this.trustedOrigin),
      200,
    );

    return (response.body as ApiSuccess<JobData>).data;
  }

  public async waitForJobStatus(
    jobId: string,
    expectedStatus: string,
    timeoutMs = 45_000,
  ): Promise<JobData> {
    const deadline = Date.now() + timeoutMs;
    let latestJob = await this.getJob(jobId);

    while (latestJob.status !== expectedStatus && Date.now() < deadline) {
      await delay(500);
      latestJob = await this.getJob(jobId);
    }

    expect(latestJob.status).toBe(expectedStatus);
    return latestJob;
  }

  public async cleanup(): Promise<void> {
    this.releaseAiProcessing();

    let cleanupError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.prisma.user.deleteMany({
          where: {
            email: this.email,
          },
        });
        cleanupError = undefined;
        break;
      } catch (error) {
        cleanupError = error;
        await delay(1_500);
      }
    }

    await Promise.all(
      [...this.uploadedVideoPaths].map((uploadedVideoPath) =>
        rm(path.resolve(process.cwd(), uploadedVideoPath), {
          force: true,
        }),
      ),
    );

    vi.unstubAllGlobals();

    if (cleanupError !== undefined) {
      throw cleanupError;
    }
  }
}
