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
import { afterAll, beforeAll, describe, expect, test } from "vitest";

process.env.NODE_ENV = "test";
process.env.ARCJET_KEY = "";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ProjectData {
  id: string;
  title: string;
  status: string;
  originalVideoUrl: string | null;
}

interface JobData {
  id: string;
  projectId: string;
  status: string;
  progress: number;
  currentStep: string | null;
}

const trustedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const testId = randomUUID();
const email = `phase-1-6-${testId}@example.com`;
const password = `Test-${testId}-Aa1!`;
const mockVideo = Buffer.from("RepurposePro Phase 1-6 integration test video");

let app: Express;
let agent: ReturnType<typeof supertest.agent>;
let prisma: PrismaClient;
let uploadedVideoPath: string | undefined;

const delay = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const expectAuthenticatedRequest = async (
  createRequest: () => SupertestTest,
  expectedStatus: number,
): Promise<SupertestResponse> => {
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
};

const getJob = async (jobId: string): Promise<JobData> => {
  const response = await expectAuthenticatedRequest(
    () => agent.get(`/api/jobs/${jobId}`).set("Origin", trustedOrigin),
    200,
  );

  return (response.body as ApiSuccess<JobData>).data;
};

const waitForJobStatus = async (
  jobId: string,
  expectedStatus: string,
  timeoutMs = 45_000,
): Promise<JobData> => {
  const deadline = Date.now() + timeoutMs;
  let latestJob = await getJob(jobId);

  while (latestJob.status !== expectedStatus && Date.now() < deadline) {
    await delay(1_000);
    latestJob = await getJob(jobId);
  }

  expect(latestJob.status).toBe(expectedStatus);
  return latestJob;
};

beforeAll(async () => {
  const [{ app: importedApp }, { prisma: importedPrisma }] = await Promise.all([
    import("../app.js"),
    import("../lib/prisma.js"),
  ]);

  app = importedApp;
  prisma = importedPrisma;
  agent = supertest.agent(app);
});

afterAll(async () => {
  let cleanupError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
      cleanupError = undefined;
      break;
    } catch (error) {
      cleanupError = error;
      await delay(1_500);
    }
  }

  if (uploadedVideoPath !== undefined) {
    await rm(path.resolve(process.cwd(), uploadedVideoPath), {
      force: true,
    });
  }

  await prisma.$disconnect();

  if (cleanupError !== undefined) {
    throw cleanupError;
  }
});

describe("RepurposePro Phase 1-6 API workflow", () => {
  test(
    "supports health, auth, project CRUD, upload, mock processing, and cancellation",
    async () => {
      const healthResponse = await supertest(app).get("/api/health").expect(200);

      expect(healthResponse.body).toMatchObject({
        success: true,
        message: "RepurposePro API Gateway is running",
        data: {
          service: "api-gateway",
          status: "healthy",
        },
      });

      await supertest(app).get("/api/me").expect(401);
      await supertest(app).get("/api/projects").expect(401);

      await agent
        .post("/api/auth/sign-up/email")
        .set("Origin", trustedOrigin)
        .send({
          name: "Phase 1-6 Integration Test",
          email,
          password,
        })
        .expect(200);

      agent = supertest.agent(app);

      await agent
        .post("/api/auth/sign-in/email")
        .set("Origin", trustedOrigin)
        .send({
          email,
          password,
        })
        .expect(200);

      const meResponse = await expectAuthenticatedRequest(
        () => agent.get("/api/me").set("Origin", trustedOrigin),
        200,
      );

      expect(meResponse.body).toMatchObject({
        success: true,
        message: "Authenticated user retrieved successfully",
        data: {
          user: {
            email,
            role: "creator",
          },
        },
      });

      const createProjectResponse = await expectAuthenticatedRequest(
        () =>
          agent.post("/api/projects").set("Origin", trustedOrigin).send({
            title: "Phase 1-6 Integration Project",
            description: "Created by the Phase 1-6 integration test",
            language: "en",
          }),
        201,
      );

      const createdProject = (
        createProjectResponse.body as ApiSuccess<ProjectData>
      ).data;

      expect(createdProject.status).toBe("draft");

      const projectListResponse = await expectAuthenticatedRequest(
        () => agent.get("/api/projects").set("Origin", trustedOrigin),
        200,
      );
      const projects = (
        projectListResponse.body as ApiSuccess<ProjectData[]>
      ).data;

      expect(projects.some((project) => project.id === createdProject.id)).toBe(
        true,
      );

      const updateProjectResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .patch(`/api/projects/${createdProject.id}`)
            .set("Origin", trustedOrigin)
            .send({
              title: "Updated Phase 1-6 Integration Project",
            }),
        200,
      );

      expect(
        (updateProjectResponse.body as ApiSuccess<ProjectData>).data.title,
      ).toBe("Updated Phase 1-6 Integration Project");

      const uploadResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .post(`/api/projects/${createdProject.id}/upload`)
            .set("Origin", trustedOrigin)
            .attach("video", mockVideo, {
              filename: "phase-1-6-test.mp4",
              contentType: "video/mp4",
            }),
        200,
      );

      const uploadedProject = (uploadResponse.body as ApiSuccess<ProjectData>)
        .data;

      expect(uploadedProject.status).toBe("uploaded");
      expect(uploadedProject.originalVideoUrl).toBeTruthy();
      uploadedVideoPath = uploadedProject.originalVideoUrl ?? undefined;

      const startCompletedJobResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .post(`/api/projects/${createdProject.id}/process`)
            .set("Origin", trustedOrigin),
        201,
      );
      const completedJobId = (
        startCompletedJobResponse.body as ApiSuccess<JobData>
      ).data.id;

      const jobListResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .get(`/api/projects/${createdProject.id}/jobs`)
            .set("Origin", trustedOrigin),
        200,
      );
      const jobs = (jobListResponse.body as ApiSuccess<JobData[]>).data;

      expect(jobs.some((job) => job.id === completedJobId)).toBe(true);

      const completedJob = await waitForJobStatus(completedJobId, "completed");

      expect(completedJob.progress).toBe(100);
      expect(completedJob.currentStep).toBe("Processing completed");

      const startCancelledJobResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .post(`/api/projects/${createdProject.id}/process`)
            .set("Origin", trustedOrigin),
        201,
      );
      const cancelledJobId = (
        startCancelledJobResponse.body as ApiSuccess<JobData>
      ).data.id;

      await waitForJobStatus(cancelledJobId, "processing");

      const cancelResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .post(`/api/jobs/${cancelledJobId}/cancel`)
            .set("Origin", trustedOrigin),
        200,
      );

      expect((cancelResponse.body as ApiSuccess<JobData>).data).toMatchObject({
        id: cancelledJobId,
        status: "cancelled",
        currentStep: "Processing cancelled",
      });

      await delay(7_000);

      const persistedCancelledJob = await getJob(cancelledJobId);

      expect(persistedCancelledJob.status).toBe("cancelled");
      expect(persistedCancelledJob.currentStep).toBe("Processing cancelled");

      const cancelledJobsResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .get(`/api/projects/${createdProject.id}/jobs?status=cancelled`)
            .set("Origin", trustedOrigin),
        200,
      );
      const cancelledJobs = (
        cancelledJobsResponse.body as ApiSuccess<JobData[]>
      ).data;

      expect(cancelledJobs).toHaveLength(1);
      expect(cancelledJobs[0]?.id).toBe(cancelledJobId);

      const projectResponse = await expectAuthenticatedRequest(
        () =>
          agent
            .get(`/api/projects/${createdProject.id}`)
            .set("Origin", trustedOrigin),
        200,
      );

      expect((projectResponse.body as ApiSuccess<ProjectData>).data.status).toBe(
        "uploaded",
      );

      await expectAuthenticatedRequest(
        () =>
          agent
            .delete(`/api/projects/${createdProject.id}`)
            .set("Origin", trustedOrigin),
        200,
      );

      await expectAuthenticatedRequest(
        () =>
          agent
            .get(`/api/projects/${createdProject.id}`)
            .set("Origin", trustedOrigin),
        404,
      );
    },
    90_000,
  );
});
