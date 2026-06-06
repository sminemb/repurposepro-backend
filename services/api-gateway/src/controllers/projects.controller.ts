import type { Request, RequestHandler } from "express";
import type { UserRole } from "@prisma/client";

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

export const createProjectController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { userId } = getAuthContext(request);
    const project = await createProject(userId, request.body as CreateProjectInput);

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
    const { userId, role } = getAuthContext(request);
    const projects = await getProjectsByUser(userId, role);

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
    const { userId, role } = getAuthContext(request);
    const { id } = request.params as ProjectIdParams;
    const project = await getProjectByIdForUser(id, userId, role);

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
    const { userId, role } = getAuthContext(request);
    const { id } = request.params as ProjectIdParams;
    const project = await updateProject(
      id,
      userId,
      role,
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
    const { userId, role } = getAuthContext(request);
    const { id } = request.params as ProjectIdParams;
    const project = await deleteProject(id, userId, role);

    if (project === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Project deleted successfully", project);
  } catch (error) {
    next(error);
  }
};
