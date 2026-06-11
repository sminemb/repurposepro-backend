import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_relative_asset_path(value: str) -> str:
    if (
        "\\" in value
        or value.startswith("/")
        or "://" in value
        or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", value)
        or any(segment in {"", ".", ".."} for segment in value.split("/"))
    ):
        raise ValueError("Expected a safe relative asset path")
    return value


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProcessVideoRequest(StrictModel):
    jobId: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
    projectId: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
    originalVideoUrl: str = Field(min_length=1, max_length=2048)
    requestedOutputs: list[Literal["summary", "reels"]] = Field(
        default_factory=lambda: ["summary", "reels"],
        min_length=1,
        max_length=2,
    )

    _validate_original_video_url = field_validator("originalVideoUrl")(
        validate_relative_asset_path
    )

    @field_validator("originalVideoUrl")
    @classmethod
    def require_supported_source_video(cls, value: str) -> str:
        if not value.lower().endswith((".mp4", ".mov", ".mkv", ".webm")):
            raise ValueError("Expected a supported source video path")
        return value

    @field_validator("requestedOutputs")
    @classmethod
    def require_unique_outputs(
        cls,
        value: list[Literal["summary", "reels"]],
    ) -> list[Literal["summary", "reels"]]:
        if len(value) != len(set(value)):
            raise ValueError("requestedOutputs must not contain duplicates")
        return value


class GeneratedVideoOutput(StrictModel):
    type: Literal["summary", "reel"]
    title: str = Field(min_length=1, max_length=200)
    outputUrl: str = Field(min_length=1, max_length=2048)
    durationSeconds: int = Field(ge=1, le=7200)
    aspectRatio: Literal["16:9", "9:16"]

    @field_validator("outputUrl")
    @classmethod
    def validate_output_url(cls, value: str) -> str:
        validate_relative_asset_path(value)
        if not value.lower().endswith(".mp4"):
            raise ValueError("Expected an MP4 output path")
        return value


class ProcessVideoResponseData(StrictModel):
    summaryVideo: GeneratedVideoOutput
    reels: list[GeneratedVideoOutput]


class ApiResponse(StrictModel):
    success: bool
    message: str
    data: ProcessVideoResponseData | dict[str, Any] | None = None
