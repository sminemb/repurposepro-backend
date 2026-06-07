from app.schemas.processing_schema import (
    GeneratedVideoOutput,
    ProcessVideoRequest,
    ProcessVideoResponseData,
)


def process_video_mock(payload: ProcessVideoRequest) -> ProcessVideoResponseData:
    summary_video = GeneratedVideoOutput(
        type="summary",
        title="Generated Summary Video",
        outputUrl=f"processed/{payload.projectId}/summary.mp4",
        durationSeconds=480,
        aspectRatio="16:9",
    )

    reel_durations = [45, 38, 52]
    reels = [
        GeneratedVideoOutput(
            type="reel",
            title=f"Generated Reel {index}",
            outputUrl=f"processed/{payload.projectId}/reel-{index}.mp4",
            durationSeconds=duration,
            aspectRatio="9:16",
        )
        for index, duration in enumerate(reel_durations, start=1)
    ]

    return ProcessVideoResponseData(summaryVideo=summary_video, reels=reels)
