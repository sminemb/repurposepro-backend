from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_process_video_returns_mock_outputs() -> None:
    project_id = "project-123"
    response = client.post(
        "/process-video",
        json={
            "jobId": "job-123",
            "projectId": project_id,
            "originalVideoUrl": "uploads/project-123/source.mp4",
            "requestedOutputs": ["summary", "reels"],
        },
    )

    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True
    assert body["data"]["summaryVideo"]["outputUrl"] == (
        f"processed/{project_id}/summary.mp4"
    )
    assert len(body["data"]["reels"]) == 3
    assert [reel["outputUrl"] for reel in body["data"]["reels"]] == [
        f"processed/{project_id}/reel-1.mp4",
        f"processed/{project_id}/reel-2.mp4",
        f"processed/{project_id}/reel-3.mp4",
    ]


def test_process_video_rejects_invalid_payload() -> None:
    response = client.post(
        "/process-video",
        json={
            "jobId": "job-123",
            "originalVideoUrl": "uploads/project-123/source.mp4",
        },
    )

    assert response.status_code == 422
