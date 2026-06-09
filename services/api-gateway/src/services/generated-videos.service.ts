import {
  GeneratedVideoStatus,
  GeneratedVideoType,
  type Prisma,
} from "@prisma/client";

import type { AiProcessVideoResponse } from "./ai-client.service.js";

export const replaceGeneratedVideosFromAiResult = async (
  transaction: Prisma.TransactionClient,
  projectId: string,
  aiResult: AiProcessVideoResponse["data"],
): Promise<void> => {
  const outputs = [aiResult.summaryVideo, ...aiResult.reels];

  await transaction.generatedVideo.deleteMany({
    where: {
      projectId,
    },
  });

  await transaction.generatedVideo.createMany({
    data: outputs.map((output) => ({
      projectId,
      type:
        output.type === "summary"
          ? GeneratedVideoType.summary
          : GeneratedVideoType.reel,
      title: output.title,
      outputUrl: output.outputUrl,
      durationSeconds: output.durationSeconds,
      aspectRatio: output.aspectRatio,
      status: GeneratedVideoStatus.ready,
    })),
  });
};
