from typing import Any

from pydantic import BaseModel, Field


class ProcessVideoRequest(BaseModel):
    jobId: str
    projectId: str
    originalVideoUrl: str
    requestedOutputs: list[str] = Field(default_factory=lambda: ["summary", "reels"])


class GeneratedVideoOutput(BaseModel):
    type: str
    title: str
    outputUrl: str
    durationSeconds: int
    aspectRatio: str


class ProcessVideoResponseData(BaseModel):
    summaryVideo: GeneratedVideoOutput
    reels: list[GeneratedVideoOutput]


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: ProcessVideoResponseData | dict[str, Any] | None = None
