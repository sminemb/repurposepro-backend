import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js";
import { uploadProjectVideo as uploadProjectVideoForProject } from "../services/videos.service.js";
import type { ProjectIdParams } from "../validators/project.validator.js";
import { AppError } from "../utils/errors.js";
import { deleteFileIfExists } from "../utils/file.js";
import { sendSuccess } from "../utils/response.js";

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

    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectIdParams;
    const project = await uploadProjectVideoForProject(id, userId, file);

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Video uploaded successfully", project);
  } catch (error) {
    await deleteFileIfExists(file?.path);
    next(error);
  }
};
