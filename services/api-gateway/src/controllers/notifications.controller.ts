import type { Request, RequestHandler } from "express";
import type { UserRole } from "@prisma/client";

import {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notifications.service.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import type {
  ListNotificationsQuery,
  NotificationIdParams,
} from "../validators/notification.validator.js";

const userRoles = new Set<UserRole>(["admin", "creator", "editor"]);

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && userRoles.has(value as UserRole);

const getAuthContext = (request: Request): { userId: string; role: UserRole } => {
  if (request.auth === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return {
    userId: request.auth.user.id,
    role: isUserRole(request.auth.user.role) ? request.auth.user.role : "creator",
  };
};

export const listNotificationsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { userId } = getAuthContext(request);
    const filters = request.validatedQuery as ListNotificationsQuery;
    const notifications = await getNotificationsForUser(userId, filters);

    sendSuccess(
      response,
      "Notifications retrieved successfully",
      notifications,
    );
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationCountController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { userId } = getAuthContext(request);
    const count = await getUnreadCountForUser(userId);

    sendSuccess(
      response,
      "Unread notification count retrieved successfully",
      {
        count,
      },
    );
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { userId, role } = getAuthContext(request);
    const { id } = request.params as NotificationIdParams;
    const notification = await markNotificationAsRead(id, userId, role);

    if (notification === null) {
      throw new AppError("Notification not found", 404);
    }

    sendSuccess(
      response,
      "Notification marked as read successfully",
      notification,
    );
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsReadController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { userId } = getAuthContext(request);
    const updatedCount = await markAllNotificationsAsRead(userId);

    sendSuccess(response, "All notifications marked as read successfully", {
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
};
