from fastapi import APIRouter

from app.schemas.processing_schema import ApiResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiResponse)
async def health_check() -> ApiResponse:
    return ApiResponse(
        success=True,
        message="RepurposePro AI Service is running",
        data={
            "service": "ai-service",
            "status": "healthy",
        },
    )
