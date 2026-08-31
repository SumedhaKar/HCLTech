"""Unit tests for the rule-based filter + embedding-ranking logic in
app.services.recommender. No FastAPI, no DB, no real Gemini call — embed_texts
is monkeypatched with a deterministic fake so ranking behavior is testable.
"""

from __future__ import annotations

import pytest

from app.services import recommender
from app.services.recommender import (
    MAX_PATH_LENGTH,
    Course,
    LearnerProfile,
    build_learning_path,
    filter_candidates,
)


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


def test_filter_returns_nothing_when_stated_interests_match_no_eligible_course():
    # A learner who states interests gets nothing rather than an irrelevant
    # full-pool fallback — a short, honest path (or none) beats a full one
    # padded with unrelated content. The router surfaces this as "no
    # suitable courses found" rather than forcing a bad recommendation.
    profile = LearnerProfile(
        goal="learn something",
        interests=["astrophysics"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [_course(id="c1", title="Python Basics", domain="Python", skills_taught=["python"])]

    result = filter_candidates(profile, courses)

    assert result == []


def test_filter_does_not_backfill_from_unrelated_domains_when_matches_are_thin():
    # Regression test: a learner asking about Law should never see
    # Cybersecurity or any other unrelated domain just because Law itself
    # only has a couple of eligible courses. Fewer, correct results beat a
    # full path padded with "closest by embedding distance" noise.
    profile = LearnerProfile(
        goal="become a lawyer",
        interests=["law"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    law_courses = [
        _course(id="law1", title="Intro to Law", domain="Law", skills_taught=["legal-fundamentals"]),
        _course(id="law2", title="Contract Law", domain="Law", skills_taught=["contract-law"]),
    ]
    unrelated = [
        _course(id=f"other{i}", title=f"Course {i}", domain="Cybersecurity", skills_taught=["security-fundamentals"])
        for i in range(5)
    ]

    result = filter_candidates(profile, law_courses + unrelated)

    assert {c.id for c in result} == {"law1", "law2"}


def test_filter_keeps_interest_matches_when_they_already_fill_a_path():
    profile = LearnerProfile(
        goal="learn python",
        interests=["python"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    matched = [_course(id=f"py{i}", title=f"Python {i}", domain="Python", skills_taught=["python"]) for i in range(MAX_PATH_LENGTH)]
    unrelated = [_course(id="unrelated", title="Pottery Basics", domain="Crafts", skills_taught=["pottery"])]

    result = filter_candidates(profile, matched + unrelated)

    assert {c.id for c in result} == {c.id for c in matched}


def test_filter_ignores_single_letter_skill_tag_false_positives():
    # Regression test: a one-letter skill tag like "c" (the language) is a
    # substring of almost any phrase — e.g. "content creation" — and must
    # not count as a match on that basis alone.
    profile = LearnerProfile(
        goal="pursue a career in marketing",
        interests=["marketing", "content creation"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(id="cs50", title="CS50", domain="Programming Fundamentals", skills_taught=["programming-fundamentals", "c", "algorithms"]),
        _course(id="mkt1", title="Content Marketing Certification", domain="Marketing", skills_taught=["content-marketing"]),
    ]

    result = filter_candidates(profile, courses)

    assert {c.id for c in result} == {"mkt1"}


def test_filter_matches_generic_interest_words_via_alias_to_specific_tags():
    # Regression test: the confirmed demo persona (PRODUCT.md) states
    # interests as "APIs" and "databases" — generic category words with no
    # substring overlap with the catalog's technology-specific skill tags
    # (nodejs, mongodb, sql-basics). Without an alias, this persona matched
    # zero courses despite the catalog having exactly the right ones.
    profile = LearnerProfile(
        goal="become a backend engineer",
        interests=["APIs", "databases"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(id="node", title="Node.js, Express, MongoDB & More", domain="Web Development", level="intermediate", skills_taught=["nodejs", "express", "mongodb"]),
        _course(id="sql", title="Introduction to SQL", domain="Programming Fundamentals", level="beginner", skills_taught=["sql-basics"]),
        _course(id="css", title="CSS Grid & Flexbox Mastery", domain="Web Development", level="beginner", skills_taught=["html-css"]),
    ]

    result = filter_candidates(profile, courses)

    assert {c.id for c in result} == {"node", "sql"}


def test_filter_excludes_broad_domain_courses_that_dont_teach_a_matched_skill():
    # Regression test: a "become a backend dev" goal gets "Web Development"
    # appended as a Gemini-grounded interest (gemini_intake.py's domain
    # taxonomy has no narrower "Backend" bucket). Web Development contains
    # both pure-frontend and backend/full-stack courses, so a bare
    # domain-name match let CSS-only courses ride in on that grounding
    # interest even though they teach nothing backend-related. Skill-tag/
    # alias matching must still work for real backend content in that domain.
    profile = LearnerProfile(
        goal="become a backend dev",
        interests=["backend", "web development"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(id="css", title="CSS Grid & Flexbox Mastery", domain="Web Development", level="beginner", skills_taught=["html-css"]),
        _course(id="responsive", title="Responsive Web Design", domain="Web Development", level="beginner", skills_taught=["html-css"]),
        _course(id="fullstack", title="Full Stack JavaScript", domain="Web Development", level="beginner", skills_taught=["html-css", "javascript-basics", "nodejs"]),
    ]

    result = filter_candidates(profile, courses)

    assert {c.id for c in result} == {"fullstack"}


def test_filter_chains_prerequisite_through_another_matched_course_in_the_same_pass():
    # Regression test: the learner's actual target course (Node.js/Express/
    # MongoDB) requires javascript-basics, which the learner hasn't completed
    # yet. The old hard-exclusion dropped it from the path entirely, even
    # though a foundations course teaching that exact prerequisite was
    # already being included in the same pass — the destination course
    # should still appear, sequenced after what unlocks it, not vanish.
    profile = LearnerProfile(
        goal="become a backend dev",
        interests=["backend"],
        experience_level="beginner",
        completed_course_ids=[],
    )
    courses = [
        _course(
            id="js-foundations",
            title="Full Stack JavaScript",
            domain="Web Development",
            level="beginner",
            skills_taught=["html-css", "javascript-basics"],
        ),
        _course(
            id="node",
            title="Node.js, Express, MongoDB & More",
            domain="Web Development",
            level="intermediate",
            skills_taught=["nodejs", "express", "mongodb"],
            prerequisite_skills=["javascript-basics"],
        ),
    ]

    result = filter_candidates(profile, courses)

    assert {c.id for c in result} == {"js-foundations", "node"}


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
