import path from "node:path";

import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createVideoUploadedNotification: vi.fn(),
  prisma: {
    project: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../services/notifications.service.js", () => ({
  createVideoUploadedNotification: mocks.createVideoUploadedNotification,
}));

const { uploadProjectVideo } = await import("../services/videos.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadProjectVideo", () => {
  test("creates a notification for the project owner after upload", async () => {
    const project = {
      id: "project-1",
      userId: "owner-1",
      title: "Source Video",
      originalVideoUrl: null,
      status: "draft",
    };
    const uploadedProject = {
      ...project,
      originalVideoUrl: "storage/uploads/project-1.mp4",
      status: "uploaded",
    };
    const file = {
      path: path.resolve("storage/uploads/project-1.mp4"),
    } as Express.Multer.File;

    mocks.prisma.project.findFirst.mockResolvedValue(project);
    mocks.prisma.project.update.mockResolvedValue(uploadedProject);
    mocks.createVideoUploadedNotification.mockResolvedValue(undefined);

    await expect(
      uploadProjectVideo("project-1", "owner-1", file),
    ).resolves.toEqual(uploadedProject);

    expect(mocks.prisma.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: "project-1",
        userId: "owner-1",
      },
    });
    expect(mocks.createVideoUploadedNotification).toHaveBeenCalledWith(
      "owner-1",
      "project-1",
      "Source Video",
    );
  });

  test("rejects a file path outside the configured upload directory", async () => {
    const file = {
      path: path.resolve("outside-upload-root.mp4"),
    } as Express.Multer.File;

    mocks.prisma.project.findFirst.mockResolvedValue({
      id: "project-1",
      userId: "owner-1",
      title: "Source Video",
    });

    await expect(
      uploadProjectVideo("project-1", "owner-1", file),
    ).rejects.toMatchObject({
      message: "Uploaded file path is outside the configured upload directory",
      statusCode: 500,
    });

    expect(mocks.prisma.project.update).not.toHaveBeenCalled();
  });
});
