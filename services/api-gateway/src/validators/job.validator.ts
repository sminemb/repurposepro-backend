import { z } from "zod";

const processingJobStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export const projectJobIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const jobIdParamSchema = z
  .object({
    id: z.string().min(1),
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
