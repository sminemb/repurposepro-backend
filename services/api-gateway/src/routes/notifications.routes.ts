import { Router } from "express";

import {
  getUnreadNotificationCountController,
  listNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notifications.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "../validators/notification.validator.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  validate({
    query: listNotificationsQuerySchema,
  }),
  listNotificationsController,
);

notificationsRouter.get(
  "/unread-count",
  getUnreadNotificationCountController,
);

notificationsRouter.patch(
  "/:id/read",
  validate({
    params: notificationIdParamSchema,
  }),
  markNotificationAsReadController,
);

notificationsRouter.patch(
  "/read-all",
  markAllNotificationsAsReadController,
);
