from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RepurposePro AI Service"
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    api_prefix: str = ""
    ai_service_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def require_production_internal_api_key(self) -> "Settings":
        if self.environment == "production" and (
            not self.ai_service_api_key or len(self.ai_service_api_key) < 32
        ):
            raise ValueError(
                "AI_SERVICE_API_KEY must be at least 32 characters in production"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
