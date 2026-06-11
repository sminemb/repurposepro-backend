import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createGeneratedVideoReadyNotification: vi.fn(),
  createProcessingCompletedNotification: vi.fn(),
  createProcessingFailedNotification: vi.fn(),
  createProcessingStartedNotification: vi.fn(),
  processVideoWithAiService: vi.fn(),
  prisma: {
    processingJob: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../services/ai-client.service.js", () => ({
  processVideoWithAiService: mocks.processVideoWithAiService,
}));

vi.mock("../services/notifications.service.js", () => ({
  createGeneratedVideoReadyNotification:
    mocks.createGeneratedVideoReadyNotification,
  createProcessingCompletedNotification:
    mocks.createProcessingCompletedNotification,
  createProcessingFailedNotification: mocks.createProcessingFailedNotification,
  createProcessingStartedNotification:
    mocks.createProcessingStartedNotification,
}));

const { runAiProcessingJob } = await import(
  "../services/job-processing.service.js"
);
const { AppError } = await import("../utils/errors.js");

const aiResponse = {
  success: true,
  message: "Mock video processing completed",
  data: {
    summaryVideo: {
      type: "summary" as const,
      title: "Generated Summary Video",
      outputUrl: "processed/project-1/summary.mp4",
      durationSeconds: 480,
      aspectRatio: "16:9",
    },
    reels: [
      {
        type: "reel" as const,
        title: "Generated Reel 1",
        outputUrl: "processed/project-1/reel-1.mp4",
        durationSeconds: 45,
        aspectRatio: "9:16",
      },
    ],
  },
};

const runnableJob = {
  id: "job-1",
  projectId: "project-1",
  status: "queued",
  project: {
    originalVideoUrl: "storage/uploads/source.mp4",
    title: "Test Project",
    userId: "user-1",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createGeneratedVideoReadyNotification.mockResolvedValue(undefined);
  mocks.createProcessingCompletedNotification.mockResolvedValue(undefined);
  mocks.createProcessingFailedNotification.mockResolvedValue(undefined);
  mocks.createProcessingStartedNotification.mockResolvedValue(undefined);
});

describe("runAiProcessingJob", () => {
  test("saves FastAPI mock outputs and completes the job and project", async () => {
    const transaction = {
      processingJob: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      project: {
        update: vi.fn().mockResolvedValue({ id: "project-1" }),
      },
      generatedVideo: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    mocks.prisma.processingJob.findUnique.mockResolvedValue(runnableJob);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    mocks.processVideoWithAiService.mockResolvedValue(aiResponse);

    await expect(runAiProcessingJob("job-1")).resolves.toBeUndefined();

    expect(mocks.processVideoWithAiService).toHaveBeenCalledWith({
      jobId: "job-1",
      projectId: "project-1",
      originalVideoUrl: "storage/uploads/source.mp4",
      requestedOutputs: ["summary", "reels"],
    });
    expect(transaction.generatedVideo.deleteMany).toHaveBeenCalledWith({
      where: {
        projectId: "project-1",
      },
    });
    expect(transaction.generatedVideo.createMany).toHaveBeenCalledWith({
      data: [
        {
          projectId: "project-1",
          type: "summary",
          title: "Generated Summary Video",
          outputUrl: "processed/project-1/summary.mp4",
          durationSeconds: 480,
          aspectRatio: "16:9",
          status: "ready",
        },
        {
          projectId: "project-1",
          type: "reel",
          title: "Generated Reel 1",
          outputUrl: "processed/project-1/reel-1.mp4",
          durationSeconds: 45,
          aspectRatio: "9:16",
          status: "ready",
        },
      ],
    });
    expect(transaction.processingJob.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "job-1",
        status: "processing",
      },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Processing completed",
        completedAt: expect.any(Date),
      },
    });
    expect(transaction.project.update).toHaveBeenLastCalledWith({
      where: {
        id: "project-1",
      },
      data: {
        status: "completed",
      },
    });
    expect(mocks.createProcessingStartedNotification).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      "Test Project",
      "job-1",
    );
    expect(mocks.createGeneratedVideoReadyNotification).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      "Test Project",
    );
    expect(mocks.createProcessingCompletedNotification).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      "Test Project",
      "job-1",
    );
  });

  test("marks the job and project failed when FastAPI fails", async () => {
    const transaction = {
      processingJob: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      project: {
        update: vi.fn().mockResolvedValue({ id: "project-1" }),
      },
    };

    mocks.prisma.processingJob.findUnique
      .mockResolvedValueOnce(runnableJob)
      .mockResolvedValueOnce({
        projectId: "project-1",
        project: {
          title: "Test Project",
          userId: "user-1",
        },
      });
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    mocks.processVideoWithAiService.mockRejectedValue(
      new AppError("AI service is unavailable", 502),
    );

    await expect(runAiProcessingJob("job-1")).resolves.toBeUndefined();

    expect(transaction.processingJob.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "job-1",
        status: {
          in: ["queued", "processing"],
        },
      },
      data: {
        status: "failed",
        errorMessage: "AI service is unavailable",
        currentStep: "Processing failed",
        completedAt: expect.any(Date),
      },
    });
    expect(transaction.project.update).toHaveBeenLastCalledWith({
      where: {
        id: "project-1",
      },
      data: {
        status: "failed",
      },
    });
    expect(mocks.createProcessingFailedNotification).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      "Test Project",
      "job-1",
    );
  });

  test("does not save results when cancellation wins the completion race", async () => {
    const transaction = {
      processingJob: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
      project: {
        update: vi.fn().mockResolvedValue({ id: "project-1" }),
      },
      generatedVideo: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    mocks.prisma.processingJob.findUnique.mockResolvedValue(runnableJob);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    mocks.processVideoWithAiService.mockResolvedValue(aiResponse);

    await expect(runAiProcessingJob("job-1")).resolves.toBeUndefined();

    expect(transaction.generatedVideo.deleteMany).not.toHaveBeenCalled();
    expect(transaction.generatedVideo.createMany).not.toHaveBeenCalled();
    expect(transaction.project.update).toHaveBeenCalledTimes(1);
  });
});
