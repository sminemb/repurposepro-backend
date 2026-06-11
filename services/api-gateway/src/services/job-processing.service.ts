import { ProcessingJobStatus, ProjectStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { processVideoWithAiService } from "./ai-client.service.js";
import { replaceGeneratedVideosFromAiResult } from "./generated-videos.service.js";
import {
  createGeneratedVideoReadyNotification,
  createProcessingCompletedNotification,
  createProcessingFailedNotification,
  createProcessingStartedNotification,
} from "./notifications.service.js";

const activeJobStatuses: ProcessingJobStatus[] = [
  ProcessingJobStatus.queued,
  ProcessingJobStatus.processing,
];

const getCleanErrorMessage = (error: unknown): string =>
  error instanceof AppError ? error.message : "AI service processing failed";

const markJobFailed = async (jobId: string, error: unknown): Promise<void> => {
  logger.error(`AI service processing job failed: ${jobId}`, error);

  const job = await prisma.processingJob.findUnique({
    where: {
      id: jobId,
    },
    select: {
      projectId: true,
      project: {
        select: {
          title: true,
          userId: true,
        },
      },
    },
  });

  if (job === null) {
    return;
  }

  const jobFailed = await prisma.$transaction(async (transaction) => {
    const failedJobUpdate = await transaction.processingJob.updateMany({
      where: {
        id: jobId,
        status: {
          in: activeJobStatuses,
        },
      },
      data: {
        status: ProcessingJobStatus.failed,
        errorMessage: getCleanErrorMessage(error),
        currentStep: "Processing failed",
        completedAt: new Date(),
      },
    });

    if (failedJobUpdate.count === 0) {
      return false;
    }

    await transaction.project.update({
      where: {
        id: job.projectId,
      },
      data: {
        status: ProjectStatus.failed,
      },
    });

    return true;
  });

  if (jobFailed) {
    await createProcessingFailedNotification(
      job.project.userId,
      job.projectId,
      job.project.title,
      jobId,
    );
  }
};

// Temporary in-process Phase 9 runner. Redis/BullMQ or an equivalent durable
// queue will replace this fire-and-forget workflow in a later phase.
export const runAiProcessingJob = async (jobId: string): Promise<void> => {
  try {
    const job = await prisma.processingJob.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        project: {
          select: {
            originalVideoUrl: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (
      job === null ||
      job.status === ProcessingJobStatus.completed ||
      job.status === ProcessingJobStatus.failed ||
      job.status === ProcessingJobStatus.cancelled
    ) {
      return;
    }

    const originalVideoUrl = job.project.originalVideoUrl;

    if (originalVideoUrl === null || originalVideoUrl.trim().length === 0) {
      throw new AppError(
        "Project must have an uploaded video before processing can start",
        400,
      );
    }

    const processingStarted = await prisma.$transaction(async (transaction) => {
      const processingUpdate = await transaction.processingJob.updateMany({
        where: {
          id: job.id,
          status: {
            in: activeJobStatuses,
          },
        },
        data: {
          status: ProcessingJobStatus.processing,
          progress: 10,
          currentStep: "Sending video to AI service",
          startedAt: new Date(),
        },
      });

      if (processingUpdate.count === 0) {
        return false;
      }

      await transaction.project.update({
        where: {
          id: job.projectId,
        },
        data: {
          status: ProjectStatus.processing,
        },
      });

      return true;
    });

    if (!processingStarted) {
      return;
    }

    await createProcessingStartedNotification(
      job.project.userId,
      job.projectId,
      job.project.title,
      job.id,
    );

    const aiResponse = await processVideoWithAiService({
      jobId: job.id,
      projectId: job.projectId,
      originalVideoUrl,
      requestedOutputs: ["summary", "reels"],
    });

    const processingCompleted = await prisma.$transaction(async (transaction) => {
      const completionUpdate = await transaction.processingJob.updateMany({
        where: {
          id: job.id,
          status: ProcessingJobStatus.processing,
        },
        data: {
          status: ProcessingJobStatus.completed,
          progress: 100,
          currentStep: "Processing completed",
          completedAt: new Date(),
        },
      });

      if (completionUpdate.count === 0) {
        return false;
      }

      await replaceGeneratedVideosFromAiResult(
        transaction,
        job.projectId,
        aiResponse.data,
      );

      await transaction.project.update({
        where: {
          id: job.projectId,
        },
        data: {
          status: ProjectStatus.completed,
        },
      });

      return true;
    });

    if (processingCompleted) {
      await Promise.all([
        createGeneratedVideoReadyNotification(
          job.project.userId,
          job.projectId,
          job.project.title,
        ),
        createProcessingCompletedNotification(
          job.project.userId,
          job.projectId,
          job.project.title,
          job.id,
        ),
      ]);
    }
  } catch (error) {
    try {
      await markJobFailed(jobId, error);
    } catch (failureUpdateError) {
      logger.error(
        `Failed to mark AI service processing job as failed: ${jobId}`,
        failureUpdateError,
      );
    }
  }
};
