import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js";
import {
  createProject,
  deleteProject,
  getProjectByIdForUser,
  getProjectsByUser,
  updateProject,
} from "../services/projects.service.js";
import type {
  CreateProjectInput,
  ProjectIdParams,
  UpdateProjectInput,
} from "../validators/project.validator.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export const createProjectController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const project = await createProject(
      userId,
      request.body as CreateProjectInput,
    );

    sendSuccess(response, "Project created successfully", project, 201);
  } catch (error) {
    next(error);
  }
};

export const listProjectsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const projects = await getProjectsByUser(userId);

    sendSuccess(response, "Projects retrieved successfully", projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectIdParams;
    const project = await getProjectByIdForUser(id, userId);

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Project retrieved successfully", project);
  } catch (error) {
    next(error);
  }
};

export const updateProjectController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectIdParams;
    const project = await updateProject(
      id,
      userId,
      request.body as UpdateProjectInput,
    );

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Project updated successfully", project);
  } catch (error) {
    next(error);
  }
};

export const deleteProjectController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectIdParams;
    const project = await deleteProject(id, userId);

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Project deleted successfully", project);
  } catch (error) {
    next(error);
  }
};
