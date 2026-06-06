import path from "node:path";

import { ProjectStatus, type Project, type UserRole } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

const canUploadToAnyProject = (role: UserRole): boolean => role === "admin";

const toLocalAssetPath = (filePath: string): string =>
  path.relative(process.cwd(), filePath).split(path.sep).join("/");

export const uploadProjectVideo = async (
  projectId: string,
  userId: string,
  role: UserRole,
  file: Express.Multer.File,
): Promise<Project | null> => {
  const existingProject = await prisma.project.findFirst({
    where: canUploadToAnyProject(role)
      ? {
          id: projectId,
        }
      : {
          id: projectId,
          userId,
        },
  });

  if (existingProject === null) {
    return null;
  }

  return prisma.project.update({
    where: {
      id: existingProject.id,
    },
    data: {
      originalVideoUrl: toLocalAssetPath(file.path),
      status: ProjectStatus.uploaded,
    },
  });
};
