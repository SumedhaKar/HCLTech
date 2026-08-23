"""Tests for POST /chat/explain.

Same style as test_chat_intake.py: the DB-fetch helper and the Gemini call
are monkeypatched on the router module, so no real Postgres or Gemini call
happens.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import chat as chat_router
from app.services.gemini_explain import GeminiExplainError, PathItemContext


ITEM_ID = "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _sample_context() -> PathItemContext:
    return PathItemContext(
        course_title="Python for Data Analysis",
        course_description="Learn Python for analyzing data.",
        course_domain="Data Analysis",
        course_level="beginner",
        skills_taught=["python", "data analysis"],
        prerequisite_skills=[],
        milestone_label="Foundations",
        sequence_order=1,
        rationale="Matches your interest in python.",
        path_goal="become a data analyst",
        other_items=[],
    )


def test_explain_returns_contract_shape(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    context = _sample_context()

    async def fake_fetch_explain_context(db, path_item_id):
        assert path_item_id == ITEM_ID
        return context

    def fake_explain_recommendation(*, question, context: PathItemContext):
        assert question == "why this course?"
        assert context.course_title == "Python for Data Analysis"
        return "This course builds the Python fundamentals your data analyst goal needs."

    monkeypatch.setattr(chat_router, "_fetch_explain_context", fake_fetch_explain_context)
    monkeypatch.setattr(chat_router, "explain_recommendation", fake_explain_recommendation)

    response = client.post(
        "/chat/explain", json={"pathItemId": ITEM_ID, "question": "why this course?"}
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"answer"}
    assert body["answer"].startswith("This course builds")


def test_explain_rejects_invalid_path_item_id(client: TestClient) -> None:
    response = client.post(
        "/chat/explain", json={"pathItemId": "not-a-uuid", "question": "why?"}
    )

    assert response.status_code == 422
    assert response.json() == {"error": "pathItemId is not a valid id"}


def test_explain_404_when_item_missing(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    async def fake_fetch_explain_context(db, path_item_id):
        return None

    monkeypatch.setattr(chat_router, "_fetch_explain_context", fake_fetch_explain_context)

    response = client.post(
        "/chat/explain", json={"pathItemId": ITEM_ID, "question": "why this course?"}
    )

    assert response.status_code == 404
    assert response.json() == {"error": "Learning path item not found"}


def test_explain_returns_502_on_gemini_failure(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    context = _sample_context()

    async def fake_fetch_explain_context(db, path_item_id):
        return context

    def failing_explain_recommendation(*, question, context):
        raise GeminiExplainError("Gemini call failed: boom")

    monkeypatch.setattr(chat_router, "_fetch_explain_context", fake_fetch_explain_context)
    monkeypatch.setattr(chat_router, "explain_recommendation", failing_explain_recommendation)

    response = client.post(
        "/chat/explain", json={"pathItemId": ITEM_ID, "question": "why this course?"}
    )

    assert response.status_code == 502
    assert response.json() == {"error": "Gemini call failed: boom"}


def test_explain_rejects_malformed_body(client: TestClient) -> None:
    response = client.post("/chat/explain", json={"pathItemId": ITEM_ID})

    assert response.status_code == 422
