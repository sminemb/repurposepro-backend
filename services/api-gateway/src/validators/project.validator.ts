import { z } from "zod";

const titleSchema = z.string().trim().min(3).max(120);
const descriptionSchema = z.string().trim().max(1000);
const languageSchema = z.string().trim().min(1).max(35);
const idSchema = z.string().trim().min(1).max(128);

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
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one project field must be provided",
  });

export const projectIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectBodySchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
