import { ProcessingJobStatus, ProjectStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";

const MOCK_STEP_DELAY_MS = 1000;

const activeJobStatuses: ProcessingJobStatus[] = [
  ProcessingJobStatus.queued,
  ProcessingJobStatus.processing,
];

const mockProcessingSteps = [
  {
    progress: 10,
    currentStep: "Preparing video",
  },
  {
    progress: 25,
    currentStep: "Extracting audio",
  },
  {
    progress: 45,
    currentStep: "Transcribing audio",
  },
  {
    progress: 65,
    currentStep: "Detecting highlights",
  },
  {
    progress: 85,
    currentStep: "Generating summary and reels",
  },
  {
    progress: 100,
    currentStep: "Processing completed",
  },
] as const;

const delay = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const isTerminalStatus = (status: ProcessingJobStatus): boolean =>
  status === ProcessingJobStatus.completed ||
  status === ProcessingJobStatus.failed ||
  status === ProcessingJobStatus.cancelled;

const markJobFailed = async (jobId: string, error: unknown): Promise<void> => {
  logger.error(`Mock processing job failed: ${jobId}`, error);

  const job = await prisma.processingJob.findUnique({
    where: {
      id: jobId,
    },
    select: {
      projectId: true,
      status: true,
    },
  });

  if (job === null || job.status === ProcessingJobStatus.cancelled) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    const failedJobUpdate = await transaction.processingJob.updateMany({
      where: {
        id: jobId,
        status: {
          not: ProcessingJobStatus.cancelled,
        },
      },
      data: {
        status: ProcessingJobStatus.failed,
        errorMessage: "Mock processing failed",
      },
    });

    if (failedJobUpdate.count === 0) {
      return;
    }

    await transaction.project.update({
      where: {
        id: job.projectId,
      },
      data: {
        status: ProjectStatus.failed,
      },
    });
  });
};

const getRunnableJob = async (jobId: string) =>
  prisma.processingJob.findUnique({
    where: {
      id: jobId,
    },
    select: {
      projectId: true,
      status: true,
    },
  });

// Temporary Phase 6 mock workflow. Redis/BullMQ and the FastAPI processing service
// will replace this timer-based runner in a later phase.
export const runMockProcessingJob = async (jobId: string): Promise<void> => {
  try {
    const job = await getRunnableJob(jobId);

    if (job === null || isTerminalStatus(job.status)) {
      return;
    }

    const processingStarted = await prisma.$transaction(async (transaction) => {
      const processingUpdate = await transaction.processingJob.updateMany({
        where: {
          id: jobId,
          status: {
            in: activeJobStatuses,
          },
        },
        data: {
          status: ProcessingJobStatus.processing,
          startedAt: new Date(),
          currentStep: "Preparing video",
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

    for (const step of mockProcessingSteps) {
      await delay(MOCK_STEP_DELAY_MS);

      const progressUpdate = await prisma.processingJob.updateMany({
        where: {
          id: jobId,
          status: ProcessingJobStatus.processing,
        },
        data: {
          progress: step.progress,
          currentStep: step.currentStep,
        },
      });

      if (progressUpdate.count === 0) {
        return;
      }
    }

    const processingCompleted = await prisma.$transaction(async (transaction) => {
      const completionUpdate = await transaction.processingJob.updateMany({
        where: {
          id: jobId,
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

    if (!processingCompleted) {
      return;
    }
  } catch (error) {
    try {
      await markJobFailed(jobId, error);
    } catch (failureUpdateError) {
      logger.error(
        `Failed to mark mock processing job as failed: ${jobId}`,
        failureUpdateError,
      );
    }
  }
};
