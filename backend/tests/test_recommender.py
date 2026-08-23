"""Unit tests for the rule-based filter + embedding-ranking logic in
app.services.recommender. No FastAPI, no DB, no real Gemini call — embed_texts
is monkeypatched with a deterministic fake so ranking behavior is testable.
"""

from __future__ import annotations

import pytest

from app.services import recommender
from app.services.recommender import Course, LearnerProfile, build_learning_path, filter_candidates


def _course(**kwargs) -> Course:
    defaults = dict(
        id="course-id",
        title="Untitled",
        description="",
        domain="General",
        level="beginner",
        skills_taught=[],
        prerequisite_skills=[],
    )
    defaults.update(kwargs)
    return Course(**defaults)


def test_filter_excludes_completed_courses():
    profile = LearnerProfile(
        goal="learn python",
        interests=["python"],
        experience_level="beginner",
        completed_course_ids=["c1"],
    )
    courses = [
        _course(id="c1", title="Python Basics", domain="Python", skills_taught=["python"]),
        _course(id="c2", title="Python Advanced Basics", domain="Python", skills_taught=["python"]),
    ]

    result = filter_candidates(profile, courses)

    assert [c.id for c in result] == ["c2"]


def test_filter_excludes_courses_with_unmet_prerequisites():
    profile = LearnerProfile(
        goal="learn ml",
        interests=["machine learning"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(
            id="c1",
            title="Intro to ML",
            domain="Machine Learning",
            skills_taught=["ml basics"],
            prerequisite_skills=["linear algebra"],
        ),
        _course(
            id="c2",
            title="ML for Beginners",
            domain="Machine Learning",
            skills_taught=["ml basics"],
            prerequisite_skills=[],
        ),
    ]

    result = filter_candidates(profile, courses)

    assert [c.id for c in result] == ["c2"]


def test_filter_allows_prereq_when_learner_completed_a_course_teaching_it():
    profile = LearnerProfile(
        goal="learn ml",
        interests=["machine learning"],
        experience_level="beginner",
        completed_course_ids=["math-101"],
    )
    courses = [
        _course(id="math-101", title="Linear Algebra", domain="Math", skills_taught=["linear algebra"]),
        _course(
            id="ml-101",
            title="Intro to ML",
            domain="Machine Learning",
            skills_taught=["ml basics"],
            prerequisite_skills=["linear algebra"],
        ),
    ]

    result = filter_candidates(profile, courses)

    assert [c.id for c in result] == ["ml-101"]


def test_filter_restricts_level_to_at_most_one_step_above_learner():
    profile = LearnerProfile(
        goal="learn ml",
        interests=["machine learning"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(id="c1", title="ML Basics", domain="Machine Learning", level="beginner"),
        _course(id="c2", title="ML Intermediate", domain="Machine Learning", level="intermediate"),
        _course(id="c3", title="ML Advanced", domain="Machine Learning", level="advanced"),
    ]

    result = filter_candidates(profile, courses)

    assert {c.id for c in result} == {"c1", "c2"}


def test_filter_falls_back_to_full_pool_when_no_interest_matches():
    profile = LearnerProfile(
        goal="learn something",
        interests=["astrophysics"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [_course(id="c1", title="Python Basics", domain="Python", skills_taught=["python"])]

    result = filter_candidates(profile, courses)

    assert [c.id for c in result] == ["c1"]


def test_build_learning_path_ranks_by_similarity_and_orders_by_level(monkeypatch: pytest.MonkeyPatch):
    profile = LearnerProfile(
        goal="become a data analyst",
        interests=["data analysis", "python"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(
            id="adv",
            title="Advanced Data Storytelling",
            domain="Data Analysis",
            level="intermediate",
            skills_taught=["data analysis", "storytelling"],
        ),
        _course(
            id="beg",
            title="Python for Data Analysis",
            domain="Data Analysis",
            level="beginner",
            skills_taught=["python", "data analysis"],
        ),
    ]

    # Fake embeddings: query vector plus one vector per candidate, in the
    # order recommender._course_text produces them (courses as filtered/passed
    # in). We don't know that order in advance here, so just return vectors
    # that make "beg" score highest regardless of position, keyed by call
    # count against candidate ids embedded in the text.
    def fake_embed_texts(texts: list[str]) -> list[list[float]]:
        vectors = []
        for t in texts:
            if t.startswith("Goal:"):
                vectors.append([1.0, 0.0])
            elif "Python for Data Analysis" in t:
                vectors.append([1.0, 0.0])  # perfect match with query
            else:
                vectors.append([0.0, 1.0])  # orthogonal - low similarity
        return vectors

    monkeypatch.setattr(recommender, "embed_texts", fake_embed_texts)

    path = build_learning_path(profile, courses)

    assert [entry.course.id for entry in path] == ["beg", "adv"]
    assert [entry.sequence_order for entry in path] == [1, 2]
    assert path[0].milestone_label == "Foundations"
    assert path[1].milestone_label == "Core Skills"
    assert "data analysis" in path[0].rationale.lower() or "python" in path[0].rationale.lower()


def test_build_learning_path_returns_empty_when_no_candidates(monkeypatch: pytest.MonkeyPatch):
    profile = LearnerProfile(
        goal="learn ml",
        interests=["machine learning"],
        experience_level="beginner",
        completed_course_ids=["only-course"],
    )
    courses = [_course(id="only-course", title="ML Basics", domain="Machine Learning")]

    def fail_embed_texts(texts: list[str]) -> list[list[float]]:
        raise AssertionError("embed_texts should not be called with zero candidates")

    monkeypatch.setattr(recommender, "embed_texts", fail_embed_texts)

    path = build_learning_path(profile, courses)

    assert path == []
