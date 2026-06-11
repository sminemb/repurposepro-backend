import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js";
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

export const listNotificationsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
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
    const userId = getAuthenticatedUserId(request);
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
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as NotificationIdParams;
    const notification = await markNotificationAsRead(id, userId);

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
    const userId = getAuthenticatedUserId(request);
    const updatedCount = await markAllNotificationsAsRead(userId);

    sendSuccess(response, "All notifications marked as read successfully", {
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
};
