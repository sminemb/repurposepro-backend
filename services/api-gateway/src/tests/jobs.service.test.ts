import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  project: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

const { startProjectProcessing } = await import("../services/jobs.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startProjectProcessing", () => {
  test("requires an uploaded video", async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      originalVideoUrl: null,
    });

    await expect(
      startProjectProcessing("project-1", "user-1"),
    ).rejects.toMatchObject({
      message: "Project must have an uploaded video before processing can start",
      statusCode: 400,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test("creates a queued job and updates the project", async () => {
    const createdJob = {
      id: "job-1",
      projectId: "project-1",
      status: "queued",
      progress: 0,
      currentStep: "Queued for processing",
    };
    const transaction = {
      processingJob: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdJob),
      },
      project: {
        update: vi.fn().mockResolvedValue({ id: "project-1" }),
      },
    };

    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      originalVideoUrl: "storage/uploads/source.mp4",
    });
    prismaMock.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      startProjectProcessing("project-1", "user-1"),
    ).resolves.toEqual(createdJob);
    expect(prismaMock.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: "project-1",
        userId: "user-1",
      },
    });
    expect(transaction.processingJob.create).toHaveBeenCalledWith({
      data: {
        projectId: "project-1",
        status: "queued",
        progress: 0,
        currentStep: "Queued for processing",
      },
    });
    expect(transaction.project.update).toHaveBeenCalledWith({
      where: {
        id: "project-1",
      },
      data: {
        status: "queued",
      },
    });
  });

  test("rejects a duplicate active processing job", async () => {
    const transaction = {
      processingJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "active-job" }),
        create: vi.fn(),
      },
      project: {
        update: vi.fn(),
      },
    };

    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      originalVideoUrl: "storage/uploads/source.mp4",
    });
    prismaMock.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      startProjectProcessing("project-1", "user-1"),
    ).rejects.toMatchObject({
      message: "Project already has an active processing job",
      statusCode: 409,
    });
    expect(transaction.processingJob.create).not.toHaveBeenCalled();
    expect(transaction.project.update).toHaveBeenCalledWith({
      where: {
        id: "project-1",
      },
      data: {
        status: "queued",
      },
    });
  });
});
