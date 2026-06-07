from fastapi.testclient import TestClient

from app.main import app

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
