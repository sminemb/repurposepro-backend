import { describe, expect, test } from "vitest";

import { listNotificationsQuerySchema } from "../validators/notification.validator.js";

describe("list notifications query validation", () => {
  test("applies defaults and converts supported query strings", () => {
    expect(listNotificationsQuerySchema.parse({})).toEqual({
      limit: 20,
      page: 1,
    });

    expect(
      listNotificationsQuerySchema.parse({
        read: "false",
        type: "processing_completed",
        limit: "50",
        page: "2",
      }),
    ).toEqual({
      read: false,
      type: "processing_completed",
      limit: 50,
      page: 2,
    });
  });

  test("rejects unsupported boolean and pagination values", () => {
    expect(
      listNotificationsQuerySchema.safeParse({
        read: "yes",
      }).success,
    ).toBe(false);
    expect(
      listNotificationsQuerySchema.safeParse({
        limit: "101",
      }).success,
    ).toBe(false);
    expect(
      listNotificationsQuerySchema.safeParse({
        page: "0",
      }).success,
    ).toBe(false);
  });
});
