import type { Request, RequestHandler } from "express";
import type { UserRole } from "@prisma/client";

import { uploadProjectVideo as uploadProjectVideoForProject } from "../services/videos.service.js";
import type { ProjectIdParams } from "../validators/project.validator.js";
import { AppError } from "../utils/errors.js";
import { deleteFileIfExists } from "../utils/file.js";
import { sendSuccess } from "../utils/response.js";

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

export const uploadProjectVideo: RequestHandler = async (
  request,
  response,
  next,
) => {
  const file = request.file;

  try {
    if (file === undefined) {
      throw new AppError("Video file is required", 400);
    }

    const { userId, role } = getAuthContext(request);
    const { id } = request.params as ProjectIdParams;
    const project = await uploadProjectVideoForProject(id, userId, role, file);

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Video uploaded successfully", project);
  } catch (error) {
    await deleteFileIfExists(file?.path);
    next(error);
  }
};
