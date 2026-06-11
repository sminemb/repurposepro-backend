import { z } from "zod";

const processingJobStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;
const idSchema = z.string().trim().min(1).max(128);

export const projectJobIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const jobIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const listProjectJobsQuerySchema = z
  .object({
    status: z.enum(processingJobStatuses).optional(),
  })
  .strict();

export type ProjectJobIdParams = z.infer<typeof projectJobIdParamSchema>;
export type JobIdParams = z.infer<typeof jobIdParamSchema>;
export type ListProjectJobsQuery = z.infer<typeof listProjectJobsQuerySchema>;
