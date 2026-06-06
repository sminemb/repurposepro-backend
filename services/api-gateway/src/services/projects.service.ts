import type { Prisma, Project, UserRole } from "@prisma/client";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validator.js";
import { prisma } from "../lib/prisma.js";

const canAccessAllProjects = (role: UserRole): boolean => role === "admin";

export const createProject = async (
  userId: string,
  input: CreateProjectInput,
): Promise<Project> =>
  prisma.project.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      language: input.language,
    },
  });

export const getProjectsByUser = async (
  userId: string,
  role?: UserRole,
): Promise<Project[]> =>
  prisma.project.findMany({
    where: role !== undefined && canAccessAllProjects(role) ? undefined : { userId },
    orderBy: {
      createdAt: "desc",
    },
  });

export const getProjectByIdForUser = async (
  projectId: string,
  userId: string,
  role: UserRole,
): Promise<Project | null> =>
  prisma.project.findFirst({
    where: canAccessAllProjects(role)
      ? {
          id: projectId,
        }
      : {
          id: projectId,
          userId,
        },
  });

export const updateProject = async (
  projectId: string,
  userId: string,
  role: UserRole,
  input: UpdateProjectInput,
): Promise<Project | null> => {
  const existingProject = await getProjectByIdForUser(projectId, userId, role);

  if (existingProject === null) {
    return null;
  }

  const data: Prisma.ProjectUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.language !== undefined) {
    data.language = input.language;
  }

  return prisma.project.update({
    where: {
      id: existingProject.id,
    },
    data,
  });
};

export const deleteProject = async (
  projectId: string,
  userId: string,
  role: UserRole,
): Promise<Project | null> => {
  const existingProject = await getProjectByIdForUser(projectId, userId, role);

  if (existingProject === null) {
    return null;
  }

  return prisma.project.delete({
    where: {
      id: existingProject.id,
    },
  });
};
