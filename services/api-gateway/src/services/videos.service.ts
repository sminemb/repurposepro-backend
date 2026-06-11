import path from "node:path";

import { ProjectStatus, type Project } from "@prisma/client";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { createVideoUploadedNotification } from "./notifications.service.js";

const uploadDirectory = path.resolve(process.cwd(), env.uploadDir);

const toLocalAssetPath = (filePath: string): string => {
  const resolvedFilePath = path.resolve(filePath);
  const relativeUploadPath = path.relative(uploadDirectory, resolvedFilePath);

  if (
    relativeUploadPath.length === 0 ||
    relativeUploadPath === ".." ||
    relativeUploadPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeUploadPath)
  ) {
    throw new AppError("Uploaded file path is outside the configured upload directory");
  }

  return path.relative(process.cwd(), resolvedFilePath).split(path.sep).join("/");
};

export const uploadProjectVideo = async (
  projectId: string,
  userId: string,
  file: Express.Multer.File,
): Promise<Project | null> => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (existingProject === null) {
    return null;
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: existingProject.id,
    },
    data: {
      originalVideoUrl: toLocalAssetPath(file.path),
      status: ProjectStatus.uploaded,
    },
  });

  await createVideoUploadedNotification(
    existingProject.userId,
    existingProject.id,
    existingProject.title,
  );

  return updatedProject;
};
