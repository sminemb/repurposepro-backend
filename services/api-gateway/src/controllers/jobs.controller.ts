import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js";
import {
  cancelJob,
  getJobByIdForUser,
  getJobsByProjectForUser,
  startProjectProcessing,
} from "../services/jobs.service.js";
import { runAiProcessingJob } from "../services/job-processing.service.js";
import type {
  JobIdParams,
  ListProjectJobsQuery,
  ProjectJobIdParams,
} from "../validators/job.validator.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { sendSuccess } from "../utils/response.js";

export const startProjectProcessingController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectJobIdParams;
    const job = await startProjectProcessing(id, userId);

    if (job === null) {
      throw new AppError("Project not found", 404);
    }

    // A durable queue will replace this in-process launch in a later phase.
    void runAiProcessingJob(job.id).catch((error: unknown) => {
      logger.error(`Unhandled background processing error: ${job.id}`, error);
    });

    sendSuccess(response, "Processing job started successfully", job, 201);
  } catch (error) {
    next(error);
  }
};

export const getJobController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as JobIdParams;
    const job = await getJobByIdForUser(id, userId);

    if (job === null) {
      throw new AppError("Processing job not found", 404);
    }

    sendSuccess(response, "Processing job retrieved successfully", job);
  } catch (error) {
    next(error);
  }
};

export const listProjectJobsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as ProjectJobIdParams;
    const filters = request.validatedQuery as ListProjectJobsQuery;
    const jobs = await getJobsByProjectForUser(id, userId, filters);

    if (jobs === null) {
      throw new AppError("Project not found", 404);
    }

    sendSuccess(response, "Processing jobs retrieved successfully", jobs);
  } catch (error) {
    next(error);
  }
};

export const cancelJobController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { id } = request.params as JobIdParams;
    const job = await cancelJob(id, userId);

    if (job === null) {
      throw new AppError("Processing job not found", 404);
    }

    sendSuccess(response, "Processing job cancelled successfully", job);
  } catch (error) {
    next(error);
  }
};
