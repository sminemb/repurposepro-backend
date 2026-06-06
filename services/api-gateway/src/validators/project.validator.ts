import { z } from "zod";

const titleSchema = z.string().trim().min(3).max(120);
const descriptionSchema = z.string().trim().max(1000);
const languageSchema = z.string().trim().min(1);

export const createProjectBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional(),
    language: languageSchema.default("en"),
  })
  .strict();

export const updateProjectBodySchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    language: languageSchema.optional(),
  })
  .strict();

export const projectIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectBodySchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
