import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  project: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

const { getProjectByIdForUser, getProjectsByUser } = await import(
  "../services/projects.service.js"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projects service ownership", () => {
  test("lists only projects owned by the authenticated user", async () => {
    prismaMock.project.findMany.mockResolvedValue([]);

    await getProjectsByUser("user-1");

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  test("gets a project only through its owner", async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    await getProjectByIdForUser("project-1", "user-1");

    expect(prismaMock.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: "project-1",
        userId: "user-1",
      },
    });
  });
});
