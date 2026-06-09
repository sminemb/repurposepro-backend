import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "vitest";

import {
  type ApiSuccess,
  ApiTestHarness,
  delay,
  INTEGRATION_TEST_TIMEOUT_MS,
  type JobData,
  type ProjectData,
} from "./api-test-harness.js";

let harness: ApiTestHarness;

beforeAll(async () => {
  harness = await ApiTestHarness.create({
    name: "processing",
  });
  await harness.signUpAndSignIn();
}, INTEGRATION_TEST_TIMEOUT_MS);

afterAll(async () => {
  await harness.cleanup();
}, INTEGRATION_TEST_TIMEOUT_MS);

afterEach(() => {
  harness.releaseAiProcessing();
});

describe("RepurposePro FastAPI-backed processing API", () => {
  test(
    "completes processing, prevents duplicates, and saves generated videos",
    async () => {
      const project = await harness.createProject(
        "Completed Processing Project",
      );
      await harness.uploadProjectVideo(project.id);
      harness.pauseAiProcessing();

      const startResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .post(`/api/projects/${project.id}/process`)
            .set("Origin", harness.trustedOrigin),
        201,
      );
      const job = (startResponse.body as ApiSuccess<JobData>).data;

      expect(job).toMatchObject({
        projectId: project.id,
        status: "queued",
        progress: 0,
        currentStep: "Queued for processing",
      });

      const duplicateJobResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .post(`/api/projects/${project.id}/process`)
            .set("Origin", harness.trustedOrigin),
        409,
      );

      expect(duplicateJobResponse.body).toMatchObject({
        success: false,
        message: "Project already has an active processing job",
      });
      harness.releaseAiProcessing();

      const jobListResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get(`/api/projects/${project.id}/jobs`)
            .set("Origin", harness.trustedOrigin),
        200,
      );
      const jobs = (jobListResponse.body as ApiSuccess<JobData[]>).data;

      expect(jobs.some((listedJob) => listedJob.id === job.id)).toBe(true);

      const completedJob = await harness.waitForJobStatus(job.id, "completed");

      expect(completedJob.progress).toBe(100);
      expect(completedJob.currentStep).toBe("Processing completed");

      const generatedVideos = await harness.prisma.generatedVideo.findMany({
        where: {
          projectId: project.id,
        },
      });

      expect(generatedVideos).toHaveLength(2);
      expect(generatedVideos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            projectId: project.id,
            type: "summary",
            status: "ready",
            outputUrl: `processed/${project.id}/summary.mp4`,
          }),
          expect.objectContaining({
            projectId: project.id,
            type: "reel",
            status: "ready",
            outputUrl: `processed/${project.id}/reel-1.mp4`,
          }),
        ]),
      );
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );

  test(
    "cancels an active job without saving later FastAPI results",
    async () => {
      const project = await harness.createProject(
        "Cancelled Processing Project",
      );
      await harness.uploadProjectVideo(project.id);
      harness.pauseAiProcessing();

      const startResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .post(`/api/projects/${project.id}/process`)
            .set("Origin", harness.trustedOrigin),
        201,
      );
      const job = (startResponse.body as ApiSuccess<JobData>).data;

      await harness.waitForJobStatus(job.id, "processing");

      const cancelResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .post(`/api/jobs/${job.id}/cancel`)
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect((cancelResponse.body as ApiSuccess<JobData>).data).toMatchObject({
        id: job.id,
        status: "cancelled",
        currentStep: "Processing cancelled",
      });

      harness.releaseAiProcessing();
      await delay(2_000);

      const persistedCancelledJob = await harness.getJob(job.id);

      expect(persistedCancelledJob.status).toBe("cancelled");
      expect(persistedCancelledJob.currentStep).toBe("Processing cancelled");

      const cancelledJobsResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get(`/api/projects/${project.id}/jobs?status=cancelled`)
            .set("Origin", harness.trustedOrigin),
        200,
      );
      const cancelledJobs = (
        cancelledJobsResponse.body as ApiSuccess<JobData[]>
      ).data;

      expect(cancelledJobs).toHaveLength(1);
      expect(cancelledJobs[0]?.id).toBe(job.id);

      const projectResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get(`/api/projects/${project.id}`)
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect((projectResponse.body as ApiSuccess<ProjectData>).data.status).toBe(
        "uploaded",
      );
      await expect(
        harness.prisma.generatedVideo.count({
          where: {
            projectId: project.id,
          },
        }),
      ).resolves.toBe(0);
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
});
