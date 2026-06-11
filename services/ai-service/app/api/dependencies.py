from secrets import compare_digest

from fastapi import Header

from app.core.config import settings
from app.utils.exceptions import AppException


async def require_internal_api_key(
    x_internal_api_key: str | None = Header(default=None),
) -> None:
    if settings.ai_service_api_key is None:
        return

    if x_internal_api_key is None or not compare_digest(
        x_internal_api_key,
        settings.ai_service_api_key,
    ):
        raise AppException("Internal service authentication required", 401)
