"""Rule-based filtering + embedding-similarity ranking for learning paths.

See docs/adr/0003-recommendation-engine-design.md: the rule-based layer
(prerequisite/tag/level filtering) runs first and is cheap, deterministic,
and shippable on its own. The remaining candidates are then ranked by
Gemini-embedding similarity between the learner's stated goal/interests and
each course's title+description+skills, so the final ordering reflects
semantic fit rather than just keyword overlap.

Deliberately DB-agnostic: everything here operates on plain dataclasses so
it can be unit-tested without a database or a real Gemini call (see
backend/tests/test_recommender.py). app/routers/recommendations.py owns
fetching rows out of Postgres and translating them into these shapes.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

from app.services.embeddings import cosine_similarity, embed_texts

MAX_PATH_LENGTH = 6

_LEVEL_RANK = {"beginner": 0, "intermediate": 1, "advanced": 2}

_MILESTONE_LABELS = {
    "beginner": "Foundations",
    "intermediate": "Core Skills",
    "advanced": "Advanced Practice",
}


@dataclass
class LearnerProfile:
    goal: str
    interests: List[str]
    experience_level: str
    completed_course_ids: List[str]
    time_budget_hours_per_week: Optional[int] = None


@dataclass
class Course:
    id: str
    title: str
    description: str
    domain: str
    level: str
    skills_taught: List[str]
    prerequisite_skills: List[str]


@dataclass
class PathEntry:
    course: Course
    sequence_order: int
    milestone_label: str
    rationale: str
    score: float


def _known_skills(completed_courses: List[Course]) -> set[str]:
    """Skills the learner already has, inferred from courses they've finished.

    Interests are deliberately excluded here — wanting to learn something is
    not the same as already knowing it, and prerequisite checks should only
    trust demonstrated skills.
    """
    skills: set[str] = set()
    for course in completed_courses:
        skills.update(s.lower() for s in course.skills_taught)
    return skills


def _matches_interest(course: Course, interests_lower: set[str]) -> bool:
    fields = [course.domain.lower(), *[s.lower() for s in course.skills_taught]]
    for interest in interests_lower:
        if not interest:
            continue
        for field in fields:
            if interest in field or field in interest:
                return True
    return False


def _prerequisites_met(course: Course, known_skills: set[str]) -> bool:
    if not course.prerequisite_skills:
        return True
    return all(p.lower() in known_skills for p in course.prerequisite_skills)


def _level_allowed(course: Course, experience_level: str) -> bool:
    learner_rank = _LEVEL_RANK.get(experience_level, 0)
    course_rank = _LEVEL_RANK.get(course.level, 0)
    # Allow the learner's own level and one level of stretch, never more.
    return course_rank <= learner_rank + 1


def filter_candidates(profile: LearnerProfile, courses: List[Course]) -> List[Course]:
    completed = set(profile.completed_course_ids)
    completed_courses = [c for c in courses if c.id in completed]
    known_skills = _known_skills(completed_courses)
    interests_lower = {i.lower() for i in profile.interests if i}

    def eligible(course: Course) -> bool:
        return (
            course.id not in completed
            and _prerequisites_met(course, known_skills)
            and _level_allowed(course, profile.experience_level)
        )

    base_pool = [c for c in courses if eligible(c)]

    if interests_lower:
        interest_matched = [c for c in base_pool if _matches_interest(c, interests_lower)]
        if interest_matched:
            return interest_matched

    # No stated interests, or none of them matched anything eligible — fall
    # back to the full prerequisite/level-eligible pool so the learner still
    # gets a path rather than an empty one.
    return base_pool


def _course_text(course: Course) -> str:
    skills = ", ".join(course.skills_taught)
    return f"{course.title}. {course.description} Skills: {skills}"


def _build_rationale(course: Course, interests_lower: set[str]) -> str:
    matched = [s for s in course.skills_taught if s.lower() in interests_lower]
    if not matched and course.domain.lower() in interests_lower:
        matched = [course.domain]

    top_skills = course.skills_taught[:2]

    if matched:
        highlight = matched[0]
        if top_skills:
            return f"Matches your interest in {highlight} and builds skills in {', '.join(top_skills)}."
        return f"Matches your interest in {highlight}."

    if top_skills:
        return f"Builds foundational skills in {', '.join(top_skills)} toward your {course.domain} goal."

    return f"A strong next step toward your goal in {course.domain}."


def rank_candidates(profile: LearnerProfile, candidates: List[Course]) -> List[Tuple[Course, float]]:
    if not candidates:
        return []

    query_text = f"Goal: {profile.goal}. Interests: {', '.join(profile.interests)}."
    texts = [query_text] + [_course_text(c) for c in candidates]
    vectors = embed_texts(texts)
    query_vector, course_vectors = vectors[0], vectors[1:]

    scored = [
        (course, cosine_similarity(query_vector, vector))
        for course, vector in zip(candidates, course_vectors)
    ]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored


def build_learning_path(profile: LearnerProfile, courses: List[Course]) -> List[PathEntry]:
    candidates = filter_candidates(profile, courses)
    ranked = rank_candidates(profile, candidates)
    top = ranked[:MAX_PATH_LENGTH]

    # Order the path itself by level progression (beginner -> advanced), using
    # embedding-similarity score as the tiebreaker within a level, so the
    # result reads as a coherent learning sequence rather than a flat
    # relevance-sorted list.
    top.sort(key=lambda pair: (_LEVEL_RANK.get(pair[0].level, 0), -pair[1]))

    interests_lower = {i.lower() for i in profile.interests if i}
    entries: List[PathEntry] = []
    for idx, (course, score) in enumerate(top, start=1):
        entries.append(
            PathEntry(
                course=course,
                sequence_order=idx,
                milestone_label=_MILESTONE_LABELS.get(course.level, course.domain),
                rationale=_build_rationale(course, interests_lower),
                score=score,
            )
        )
    return entries
