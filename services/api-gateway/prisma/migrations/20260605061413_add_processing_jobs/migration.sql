-- CreateEnum
CREATE TYPE "ProcessingJobType" AS ENUM ('video_processing', 'summary_generation', 'reels_generation');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "GeneratedVideoType" AS ENUM ('summary', 'reel');

-- CreateEnum
CREATE TYPE "GeneratedVideoStatus" AS ENUM ('pending', 'rendering', 'ready', 'failed');

-- CreateTable
CREATE TABLE "processing_job" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobType" "ProcessingJobType" NOT NULL DEFAULT 'video_processing',
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_video" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "GeneratedVideoType" NOT NULL,
    "title" TEXT NOT NULL,
    "outputUrl" TEXT,
    "aspectRatio" TEXT,
    "durationSeconds" INTEGER,
    "status" "GeneratedVideoStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processing_job_projectId_idx" ON "processing_job"("projectId");

-- CreateIndex
CREATE INDEX "generated_video_projectId_idx" ON "generated_video"("projectId");

-- AddForeignKey
ALTER TABLE "processing_job" ADD CONSTRAINT "processing_job_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_video" ADD CONSTRAINT "generated_video_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
