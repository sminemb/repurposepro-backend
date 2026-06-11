from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_root_returns_service_info() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "RepurposePro AI Service",
        "data": {
            "service": "ai-service",
            "status": "running",
        },
    }


def test_health_returns_healthy_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "RepurposePro AI Service is running",
        "data": {
            "service": "ai-service",
            "status": "healthy",
        },
    }


def test_internal_api_key_protects_service_routes() -> None:
    original_key = settings.ai_service_api_key
    settings.ai_service_api_key = "test-internal-key"

    try:
        unauthorized_response = client.get("/health")
        authorized_response = client.get(
            "/health",
            headers={"X-Internal-API-Key": "test-internal-key"},
        )
    finally:
        settings.ai_service_api_key = original_key

    assert unauthorized_response.status_code == 401
    assert unauthorized_response.json() == {
        "success": False,
        "message": "Internal service authentication required",
        "data": None,
    }
    assert authorized_response.status_code == 200
