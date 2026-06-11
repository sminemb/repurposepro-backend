import { z } from "zod";

export const notificationTypes = [
  "video_uploaded",
  "processing_started",
  "processing_completed",
  "processing_failed",
  "generated_video_ready",
] as const;
const idSchema = z.string().trim().min(1).max(128);

const integerStringSchema = z
  .string()
  .regex(/^\d+$/, "Expected a positive integer")
  .transform(Number);

export const notificationIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const listNotificationsQuerySchema = z
  .object({
    read: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    type: z.enum(notificationTypes).optional(),
    limit: integerStringSchema
      .pipe(z.number().int().min(1).max(100))
      .default(20),
    page: integerStringSchema.pipe(z.number().int().min(1)).default(1),
  })
  .strict();

export type NotificationIdParams = z.infer<typeof notificationIdParamSchema>;
export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
