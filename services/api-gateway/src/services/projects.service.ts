import type { Prisma, Project } from "@prisma/client";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validator.js";
import { prisma } from "../lib/prisma.js";

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
): Promise<Project[]> =>
  prisma.project.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });

export const getProjectByIdForUser = async (
  projectId: string,
  userId: string,
): Promise<Project | null> =>
  prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

export const updateProject = async (
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<Project | null> => {
  const existingProject = await getProjectByIdForUser(projectId, userId);

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
): Promise<Project | null> => {
  const existingProject = await getProjectByIdForUser(projectId, userId);

  if (existingProject === null) {
    return null;
  }

  return prisma.project.delete({
    where: {
      id: existingProject.id,
    },
  });
};
