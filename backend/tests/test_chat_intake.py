"""Tests for POST /chat/intake.

The Gemini-calling function (app.services.gemini_intake.run_intake_turn) is
monkeypatched out here — these tests only verify the route wiring and
response shape, never call the real API. See docs/contract/api-contract.md
for the response shape being asserted against.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import chat as chat_router


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_intake_returns_contract_shape_when_profile_incomplete(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    def fake_run_intake_turn(message: str, history: list[dict[str, str]]) -> dict:
        assert message == "I want to get into data science"
        assert history == []
        return {
            "reply": "Nice goal! What's your current experience level with data or programming?",
            "profilePatch": {"goal": "get into data science", "interests": ["data science"]},
            "profileComplete": False,
        }

    monkeypatch.setattr(chat_router, "run_intake_turn", fake_run_intake_turn)

    response = client.post(
        "/chat/intake",
        json={"message": "I want to get into data science", "history": []},
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"reply", "profilePatch", "profileComplete"}
    assert body["reply"].startswith("Nice goal!")
    assert body["profilePatch"]["goal"] == "get into data science"
    assert body["profilePatch"]["interests"] == ["data science"]
    assert body["profilePatch"]["experienceLevel"] is None
    assert body["profileComplete"] is False


def test_intake_marks_profile_complete_once_key_fields_known(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    def fake_run_intake_turn(message: str, history: list[dict[str, str]]) -> dict:
        return {
            "reply": "Great, I've got what I need to build your path.",
            "profilePatch": {
                "goal": "get into data science",
                "interests": ["data science", "python"],
                "experienceLevel": "beginner",
                "timeBudgetHoursPerWeek": 5,
            },
            "profileComplete": True,
        }

    monkeypatch.setattr(chat_router, "run_intake_turn", fake_run_intake_turn)

    response = client.post(
        "/chat/intake",
        json={
            "message": "I'm a beginner and can do about 5 hours a week",
            "history": [
                {"role": "user", "content": "I want to get into data science"},
                {"role": "assistant", "content": "What's your experience level?"},
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["profileComplete"] is True
    assert body["profilePatch"]["experienceLevel"] == "beginner"
    assert body["profilePatch"]["timeBudgetHoursPerWeek"] == 5


def test_intake_returns_error_shape_on_gemini_failure(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    from app.services.gemini_intake import GeminiIntakeError

    def fake_run_intake_turn(message: str, history: list[dict[str, str]]) -> dict:
        raise GeminiIntakeError("GEMINI_API_KEY is not configured")

    monkeypatch.setattr(chat_router, "run_intake_turn", fake_run_intake_turn)

    response = client.post("/chat/intake", json={"message": "hi", "history": []})

    assert response.status_code == 502
    assert response.json() == {"error": "GEMINI_API_KEY is not configured"}


def test_intake_rejects_malformed_body(client: TestClient) -> None:
    response = client.post("/chat/intake", json={"history": []})

    assert response.status_code == 422
