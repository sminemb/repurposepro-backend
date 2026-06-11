from fastapi import APIRouter, Depends

from app.api.dependencies import require_internal_api_key
from app.schemas.processing_schema import ApiResponse

router = APIRouter(
    tags=["health"],
    dependencies=[Depends(require_internal_api_key)],
)


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
