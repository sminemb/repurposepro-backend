import {
  NotificationType,
  type Notification,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  page?: number;
}

export interface NotificationList {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const createNotification = (
  input: CreateNotificationInput,
): Promise<Notification> =>
  prisma.notification.create({
    data: input,
  });

const createNotificationSafely = async (
  eventName: string,
  input: CreateNotificationInput,
): Promise<void> => {
  try {
    await createNotification(input);
  } catch (error) {
    logger.error(`Failed to create ${eventName} notification`, error);
  }
};

export const getNotificationsForUser = async (
  userId: string,
  filters: NotificationFilters = {},
): Promise<NotificationList> => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const where: Prisma.NotificationWhereInput = {
    userId,
    read: filters.read,
    type: filters.type,
  };

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({
      where,
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const getUnreadCountForUser = (userId: string): Promise<number> =>
  prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
): Promise<Notification | null> => {
  const updateResult = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });
};

export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result.count;
};

export const createVideoUploadedNotification = (
  userId: string,
  projectId: string,
  projectTitle: string,
): Promise<void> =>
  createNotificationSafely("video uploaded", {
    userId,
    type: NotificationType.video_uploaded,
    title: "Video uploaded",
    message: `Your video for ${projectTitle} was uploaded successfully.`,
    metadata: {
      projectId,
    },
  });

export const createProcessingStartedNotification = (
  userId: string,
  projectId: string,
  projectTitle: string,
  jobId: string,
): Promise<void> =>
  createNotificationSafely("processing started", {
    userId,
    type: NotificationType.processing_started,
    title: "Processing started",
    message: `Processing for ${projectTitle} has started.`,
    metadata: {
      projectId,
      jobId,
    },
  });

export const createProcessingCompletedNotification = (
  userId: string,
  projectId: string,
  projectTitle: string,
  jobId: string,
): Promise<void> =>
  createNotificationSafely("processing completed", {
    userId,
    type: NotificationType.processing_completed,
    title: "Processing completed",
    message: `Processing for ${projectTitle} completed successfully.`,
    metadata: {
      projectId,
      jobId,
    },
  });

export const createProcessingFailedNotification = (
  userId: string,
  projectId: string,
  projectTitle: string,
  jobId: string,
): Promise<void> =>
  createNotificationSafely("processing failed", {
    userId,
    type: NotificationType.processing_failed,
    title: "Processing failed",
    message: `Processing for ${projectTitle} failed.`,
    metadata: {
      projectId,
      jobId,
    },
  });

export const createGeneratedVideoReadyNotification = (
  userId: string,
  projectId: string,
  projectTitle: string,
): Promise<void> =>
  createNotificationSafely("generated video ready", {
    userId,
    type: NotificationType.generated_video_ready,
    title: "Generated videos ready",
    message: `Your generated videos for ${projectTitle} are ready.`,
    metadata: {
      projectId,
    },
  });
