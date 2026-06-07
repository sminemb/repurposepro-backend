from fastapi import APIRouter

from app.schemas.processing_schema import ApiResponse, ProcessVideoRequest
from app.services.processing_service import process_video_mock

router = APIRouter(tags=["processing"])


@router.post("/process-video", response_model=ApiResponse)
async def process_video(payload: ProcessVideoRequest) -> ApiResponse:
    result = process_video_mock(payload)
    return ApiResponse(
        success=True,
        message="Mock video processing completed",
        data=result,
    )
