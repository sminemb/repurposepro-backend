import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import multer from "multer";
import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";

const allowedVideoExtensions = new Set([".mp4", ".mov", ".mkv", ".webm"]);
const allowedVideoMimeTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/webm",
]);
const uploadDirectory = path.resolve(process.cwd(), env.uploadDir);
const maxFileSizeBytes = env.maxUploadSizeMb * 1024 * 1024;

const sanitizeFilenamePart = (value: string): string => {
  const sanitizedValue = value.replace(/[^a-zA-Z0-9_-]/g, "");

  return sanitizedValue.length > 0 ? sanitizedValue : "project";
};

const getRouteParamValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "project";
  }

  return value ?? "project";
};

const getVideoExtension = (file: Express.Multer.File): string =>
  path.extname(file.originalname).toLowerCase();

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    void mkdir(uploadDirectory, { recursive: true })
      .then(() => {
        callback(null, uploadDirectory);
      })
      .catch((error: unknown) => {
        callback(
          error instanceof Error
            ? error
            : new Error("Failed to prepare upload directory"),
          uploadDirectory,
        );
      });
  },
  filename: (request, file, callback) => {
    const projectId = sanitizeFilenamePart(getRouteParamValue(request.params.id));
    const timestamp = Date.now();
    const randomValue = randomUUID().replaceAll("-", "").slice(0, 12);
    const extension = getVideoExtension(file);

    callback(null, `${projectId}-${timestamp}-${randomValue}${extension}`);
  },
});

const videoUpload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    const extension = getVideoExtension(file);

    if (
      !allowedVideoExtensions.has(extension) ||
      !allowedVideoMimeTypes.has(file.mimetype)
    ) {
      callback(
        new AppError(
          "Invalid video file type. Allowed types: mp4, mov, mkv, webm",
          400,
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export const uploadSingleVideo: RequestHandler = (request, response, next) => {
  videoUpload.single("video")(request, response, (error: unknown) => {
    if (error === undefined) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        sendError(
          response,
          `Video file must be ${env.maxUploadSizeMb} MB or smaller`,
          [],
          413,
        );
        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        sendError(
          response,
          'Only a single video file field named "video" is allowed',
          [],
          400,
        );
        return;
      }

      sendError(response, "Video upload failed", [{ code: error.code }], 400);
      return;
    }

    if (error instanceof AppError) {
      sendError(response, error.message, error.errors, error.statusCode);
      return;
    }

    next(error);
  });
};
