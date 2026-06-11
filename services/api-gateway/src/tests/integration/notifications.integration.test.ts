import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  type ApiSuccess,
  ApiTestHarness,
  delay,
  INTEGRATION_TEST_TIMEOUT_MS,
  type JobData,
} from "./api-test-harness.js";

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: {
    projectId?: string;
    jobId?: string;
  } | null;
}

interface NotificationListData {
  notifications: NotificationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

let harness: ApiTestHarness;

beforeAll(async () => {
  harness = await ApiTestHarness.create({
    name: "notifications",
  });
  await harness.signUpAndSignIn();
}, INTEGRATION_TEST_TIMEOUT_MS);

afterAll(async () => {
  await harness.cleanup();
}, INTEGRATION_TEST_TIMEOUT_MS);

describe("RepurposePro notification flow", () => {
  test(
    "creates, lists, counts, and marks upload and processing notifications as read",
    async () => {
      const project = await harness.createProject("Notification Flow Project");
      await harness.uploadProjectVideo(project.id);

      const uploadNotificationsResponse =
        await harness.expectAuthenticatedRequest(
          () =>
            harness.agent
              .get("/api/notifications")
              .set("Origin", harness.trustedOrigin),
          200,
        );
      const uploadNotifications = (
        uploadNotificationsResponse.body as ApiSuccess<NotificationListData>
      ).data;

      expect(uploadNotifications.notifications).toHaveLength(1);
      expect(uploadNotifications.notifications[0]).toMatchObject({
        type: "video_uploaded",
        title: "Video uploaded",
        read: false,
        metadata: {
          projectId: project.id,
        },
      });

      const startResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .post(`/api/projects/${project.id}/process`)
            .set("Origin", harness.trustedOrigin),
        201,
      );
      const job = (startResponse.body as ApiSuccess<JobData>).data;

      await harness.waitForJobStatus(job.id, "completed");

      let completedNotificationsResponse =
        await harness.expectAuthenticatedRequest(
          () =>
            harness.agent
              .get("/api/notifications")
              .set("Origin", harness.trustedOrigin),
          200,
        );
      const completedNotifications = (
        completedNotificationsResponse.body as ApiSuccess<NotificationListData>
      ).data;

      for (
        let attempt = 0;
        completedNotifications.notifications.length < 4 && attempt < 10;
        attempt += 1
      ) {
        await delay(250);
        completedNotificationsResponse = await harness.expectAuthenticatedRequest(
          () =>
            harness.agent
              .get("/api/notifications")
              .set("Origin", harness.trustedOrigin),
          200,
        );
        const latestNotifications = (
          completedNotificationsResponse.body as ApiSuccess<NotificationListData>
        ).data;

        completedNotifications.notifications = latestNotifications.notifications;
        completedNotifications.pagination = latestNotifications.pagination;
      }

      expect(completedNotifications.notifications).toHaveLength(4);
      expect(
        completedNotifications.notifications.map(
          (notification) => notification.type,
        ),
      ).toEqual(
        expect.arrayContaining([
          "video_uploaded",
          "processing_started",
          "generated_video_ready",
          "processing_completed",
        ]),
      );
      expect(
        completedNotifications.notifications.every(
          (notification) =>
            notification.metadata?.projectId === project.id &&
            notification.read === false,
        ),
      ).toBe(true);

      const unreadCountResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get("/api/notifications/unread-count")
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect(
        (unreadCountResponse.body as ApiSuccess<{ count: number }>).data.count,
      ).toBe(4);

      const notificationToRead = completedNotifications.notifications[0];

      expect(notificationToRead).toBeDefined();

      const markOneReadResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .patch(`/api/notifications/${notificationToRead?.id}/read`)
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect(
        (markOneReadResponse.body as ApiSuccess<NotificationData>).data,
      ).toMatchObject({
        id: notificationToRead?.id,
        read: true,
      });

      const markAllReadResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .patch("/api/notifications/read-all")
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect(
        (markAllReadResponse.body as ApiSuccess<{ updatedCount: number }>).data
          .updatedCount,
      ).toBe(3);

      const finalUnreadCountResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get("/api/notifications/unread-count")
            .set("Origin", harness.trustedOrigin),
        200,
      );

      expect(
        (finalUnreadCountResponse.body as ApiSuccess<{ count: number }>).data
          .count,
      ).toBe(0);
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
});
