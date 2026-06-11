from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import health, processing
from app.api.dependencies import require_internal_api_key
from app.core.config import settings
from app.core.logging import configure_logging
from app.schemas.processing_schema import ApiResponse
from app.utils.exceptions import AppException

logger = configure_logging()

app = FastAPI(title=settings.app_name)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(processing.router, prefix=settings.api_prefix)


@app.exception_handler(AppException)
async def handle_app_exception(_: Request, exc: AppException) -> JSONResponse:
    logger.warning("Application error: %s", exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": None,
        },
    )


@app.get(
    "/",
    response_model=ApiResponse,
    dependencies=[Depends(require_internal_api_key)],
)
async def root() -> ApiResponse:
    return ApiResponse(
        success=True,
        message="RepurposePro AI Service",
        data={
            "service": "ai-service",
            "status": "running",
        },
    )
