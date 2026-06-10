import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    notification: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mocks.prisma,
}));

const {
  getNotificationsForUser,
  getUnreadCountForUser,
  markNotificationAsRead,
} = await import("../services/notifications.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notifications service", () => {
  test("lists only the user's notifications with filters and pagination", async () => {
    const notifications = [
      {
        id: "notification-1",
        userId: "user-1",
      },
    ];

    mocks.prisma.$transaction.mockResolvedValue([notifications, 1]);

    await expect(
      getNotificationsForUser("user-1", {
        read: false,
        type: "video_uploaded",
        limit: 10,
        page: 2,
      }),
    ).resolves.toEqual({
      notifications,
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    expect(mocks.prisma.notification.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        read: false,
        type: "video_uploaded",
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: 10,
      take: 10,
    });
    expect(mocks.prisma.notification.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        read: false,
        type: "video_uploaded",
      },
    });
  });

  test("gets the user's unread count", async () => {
    mocks.prisma.notification.count.mockResolvedValue(3);

    await expect(getUnreadCountForUser("user-1")).resolves.toBe(3);

    expect(mocks.prisma.notification.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        read: false,
      },
    });
  });

  test("marks an owned notification as read", async () => {
    const notification = {
      id: "notification-1",
      userId: "user-1",
      read: true,
    };

    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.notification.findUnique.mockResolvedValue(notification);

    await expect(
      markNotificationAsRead("notification-1", "user-1", "creator"),
    ).resolves.toEqual(notification);

    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notification-1",
        userId: "user-1",
      },
      data: {
        read: true,
      },
    });
  });

  test("does not mark another user's notification as read", async () => {
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      markNotificationAsRead("notification-2", "user-1", "creator"),
    ).resolves.toBeNull();

    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notification-2",
        userId: "user-1",
      },
      data: {
        read: true,
      },
    });
    expect(mocks.prisma.notification.findUnique).not.toHaveBeenCalled();
  });
});
