"""Tests for POST /recommendations/generate.

Mirrors the mocking style of test_chat_intake.py: the DB-fetch helpers and
the recommender are monkeypatched on the router module directly, and the
`get_db` dependency is overridden with an in-memory fake session, so no real
Postgres connection or Gemini call ever happens.
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from app.routers import recommendations as recommendations_router
from app.services.embeddings import GeminiEmbeddingError
from app.services.recommender import Course, LearnerProfile, PathEntry

MOCK_LEARNER_ID = "00000000-0000-0000-0000-000000000001"


class FakeAsyncSession:
    """Records every SQL statement executed against it; never touches a DB."""

    def __init__(self) -> None:
        self.executed: list[tuple[str, dict[str, Any]]] = []
        self.committed = False

    async def execute(self, statement, params=None):  # noqa: ANN001
        self.executed.append((str(statement), params or {}))

        class _Result:
            def mappings(self_inner):
                class _Mappings:
                    def first(self_inner2):
                        return None

                    def all(self_inner2):
                        return []

                return _Mappings()

        return _Result()

    async def commit(self) -> None:
        self.committed = True


@pytest.fixture
def fake_session() -> FakeAsyncSession:
    return FakeAsyncSession()


@pytest.fixture
def client(fake_session: FakeAsyncSession) -> TestClient:
    async def override_get_db():
        yield fake_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


def _sample_profile() -> LearnerProfile:
    return LearnerProfile(
        goal="become a data analyst",
        interests=["data analysis", "python"],
        experience_level="beginner",
        completed_course_ids=[],
    )


def _sample_courses() -> list[Course]:
    return [
        Course(
            id="11111111-1111-1111-1111-111111111111",
            title="Python for Data Analysis",
            description="Learn Python for analyzing data.",
            domain="Data Analysis",
            level="beginner",
            skills_taught=["python", "data analysis"],
            prerequisite_skills=[],
        )
    ]


def test_generate_returns_contract_shape(
    monkeypatch: pytest.MonkeyPatch, client: TestClient, fake_session: FakeAsyncSession
) -> None:
    profile = _sample_profile()
    courses = _sample_courses()

    async def fake_fetch_profile(db, learner_id):
        assert learner_id == MOCK_LEARNER_ID
        return profile

    async def fake_fetch_courses(db):
        return courses

    def fake_build_learning_path(p, c):
        assert p is profile
        assert c is courses
        return [
            PathEntry(
                course=courses[0],
                sequence_order=1,
                milestone_label="Foundations",
                rationale="Matches your interest in python.",
                score=0.9,
            )
        ]

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)
    monkeypatch.setattr(recommendations_router, "_fetch_courses", fake_fetch_courses)
    monkeypatch.setattr(recommendations_router, "build_learning_path", fake_build_learning_path)

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"id", "goal", "items"}
    assert body["goal"] == "become a data analyst"
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert set(item.keys()) == {"id", "courseId", "sequenceOrder", "milestoneLabel", "rationale", "status"}
    assert item["courseId"] == courses[0].id
    assert item["sequenceOrder"] == 1
    assert item["milestoneLabel"] == "Foundations"
    assert item["status"] == "not_started"
    assert fake_session.committed is True
    # one insert for the path, one for the single item
    insert_statements = [sql for sql, _ in fake_session.executed]
    assert any("insert into learning_paths" in sql for sql in insert_statements)
    assert any("insert into learning_path_items" in sql for sql in insert_statements)


def test_generate_rejects_invalid_learner_id(client: TestClient) -> None:
    response = client.post("/recommendations/generate", json={"learnerId": "not-a-uuid"})

    assert response.status_code == 422
    assert response.json() == {"error": "learnerId is not a valid id"}


def test_generate_404_when_profile_missing(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    async def fake_fetch_profile(db, learner_id):
        return None

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 404
    assert response.json() == {"error": "Learner profile not found"}


def test_generate_422_when_profile_incomplete(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    incomplete_profile = LearnerProfile(
        goal="", interests=[], experience_level="beginner", completed_course_ids=[]
    )

    async def fake_fetch_profile(db, learner_id):
        return incomplete_profile

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 422


def test_generate_422_when_no_courses(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    profile = _sample_profile()

    async def fake_fetch_profile(db, learner_id):
        return profile

    async def fake_fetch_courses(db):
        return []

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)
    monkeypatch.setattr(recommendations_router, "_fetch_courses", fake_fetch_courses)

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 422
    assert response.json() == {"error": "No courses available to recommend"}


def test_generate_422_when_no_suitable_courses(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    profile = _sample_profile()
    courses = _sample_courses()

    async def fake_fetch_profile(db, learner_id):
        return profile

    async def fake_fetch_courses(db):
        return courses

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)
    monkeypatch.setattr(recommendations_router, "_fetch_courses", fake_fetch_courses)
    monkeypatch.setattr(recommendations_router, "build_learning_path", lambda p, c: [])

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 422
    assert response.json() == {"error": "No suitable courses found for this learner's profile"}


def test_generate_returns_502_on_gemini_failure(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    profile = _sample_profile()
    courses = _sample_courses()

    async def fake_fetch_profile(db, learner_id):
        return profile

    async def fake_fetch_courses(db):
        return courses

    def failing_build_learning_path(p, c):
        raise GeminiEmbeddingError("Gemini embedding call failed: boom")

    monkeypatch.setattr(recommendations_router, "_fetch_profile", fake_fetch_profile)
    monkeypatch.setattr(recommendations_router, "_fetch_courses", fake_fetch_courses)
    monkeypatch.setattr(recommendations_router, "build_learning_path", failing_build_learning_path)

    response = client.post("/recommendations/generate", json={"learnerId": MOCK_LEARNER_ID})

    assert response.status_code == 502
    assert response.json() == {"error": "Gemini embedding call failed: boom"}


def test_generate_rejects_malformed_body(client: TestClient) -> None:
    response = client.post("/recommendations/generate", json={})

    assert response.status_code == 422
