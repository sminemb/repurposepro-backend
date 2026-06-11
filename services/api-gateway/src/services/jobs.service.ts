import {
  ProcessingJobStatus,
  ProjectStatus,
  type ProcessingJob,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";

export interface JobFilters {
  status?: ProcessingJobStatus;
}

const activeJobStatuses: ProcessingJobStatus[] = [
  ProcessingJobStatus.queued,
  ProcessingJobStatus.processing,
];

export const startProjectProcessing = async (
  projectId: string,
  userId: string,
): Promise<ProcessingJob | null> => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (project === null) {
    return null;
  }

  if (
    project.originalVideoUrl === null ||
    project.originalVideoUrl.trim().length === 0
  ) {
    throw new AppError(
      "Project must have an uploaded video before processing can start",
      400,
    );
  }

  return prisma.$transaction(async (transaction) => {
    // Updating first locks the project row so concurrent starts serialize.
    await transaction.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: ProjectStatus.queued,
      },
    });

    const activeJob = await transaction.processingJob.findFirst({
      where: {
        projectId: project.id,
        status: {
          in: activeJobStatuses,
        },
      },
      select: {
        id: true,
      },
    });

    if (activeJob !== null) {
      throw new AppError("Project already has an active processing job", 409);
    }

    const job = await transaction.processingJob.create({
      data: {
        projectId: project.id,
        status: ProcessingJobStatus.queued,
        progress: 0,
        currentStep: "Queued for processing",
      },
    });

    return job;
  });
};

export const getJobByIdForUser = async (
  jobId: string,
  userId: string,
): Promise<ProcessingJob | null> =>
  prisma.processingJob.findFirst({
    where: {
      id: jobId,
      project: {
        userId,
      },
    },
  });

export const getJobsByProjectForUser = async (
  projectId: string,
  userId: string,
  filters: JobFilters = {},
): Promise<ProcessingJob[] | null> => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (project === null) {
    return null;
  }

  return prisma.processingJob.findMany({
    where: {
      projectId: project.id,
      status: filters.status,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const cancelJob = async (
  jobId: string,
  userId: string,
): Promise<ProcessingJob | null> => {
  const job = await getJobByIdForUser(jobId, userId);

  if (job === null) {
    return null;
  }

  if (!activeJobStatuses.includes(job.status)) {
    throw new AppError("Only queued or processing jobs can be cancelled", 409);
  }

  // The Phase 9 in-process runner cannot abort an active HTTP request. This
  // status guard prevents cancelled jobs from saving later AI results.
  return prisma.$transaction(async (transaction) => {
    const cancellationUpdate = await transaction.processingJob.updateMany({
      where: {
        id: job.id,
        status: {
          in: activeJobStatuses,
        },
      },
      data: {
        status: ProcessingJobStatus.cancelled,
        currentStep: "Processing cancelled",
      },
    });

    if (cancellationUpdate.count === 0) {
      throw new AppError("Only queued or processing jobs can be cancelled", 409);
    }

    const activeJobCount = await transaction.processingJob.count({
      where: {
        projectId: job.projectId,
        id: {
          not: job.id,
        },
        status: {
          in: activeJobStatuses,
        },
      },
    });

    if (activeJobCount === 0) {
      await transaction.project.update({
        where: {
          id: job.projectId,
        },
        data: {
          status: ProjectStatus.uploaded,
        },
      });
    }

    const cancelledJob = await transaction.processingJob.findUnique({
      where: {
        id: job.id,
      },
    });

    if (cancelledJob === null) {
      throw new AppError("Processing job not found", 404);
    }

    return cancelledJob;
  });
};
