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


_MIN_MATCH_LENGTH = 3

# Catalog skill tags are named after specific technologies (nodejs, mongodb,
# sql-basics) rather than the broader category words a learner naturally
# types (API, database, backend) — plain substring matching finds nothing in
# common, even though the courses are exactly what the learner wants (e.g.
# the "become a backend engineer" reference persona's own stated interests,
# "APIs" and "databases", matched zero courses before this map existed).
# Deliberately a small, explicit, reviewed list rather than free-text
# title/description search: see _matches_interest for why that was tried and
# reverted (generic words false-matching unrelated descriptions). An alias
# entry only ever points at real tags already in the catalog, so it can't
# introduce that same risk.
_INTEREST_ALIASES: dict[str, tuple[str, ...]] = {
    "api": ("nodejs", "express", "graphql"),
    "apis": ("nodejs", "express", "graphql"),
    "database": ("sql-basics", "mongodb"),
    "databases": ("sql-basics", "mongodb"),
    "backend": ("nodejs", "express", "mongodb", "sql-basics"),
    "back-end": ("nodejs", "express", "mongodb", "sql-basics"),
    "frontend": ("html-css", "react", "javascript-basics", "typescript"),
    "front-end": ("html-css", "react", "javascript-basics", "typescript"),
}

# Domains whose courses span genuinely distinct skill clusters — Web
# Development contains courses that are pure frontend (CSS Grid & Flexbox,
# skills=["html-css"]) alongside courses that are backend/full-stack
# (Node.js/Express/MongoDB). A bare domain-name match is too weak a
# relevance signal here: it let a Gemini-appended "Web Development" grounding
# interest (added for a "backend dev" goal, since the catalog's domain list
# has no narrower "Backend" bucket) pull in CSS-only courses that have
# nothing to do with backend work. Contrast with a domain like Law, where
# every course genuinely is about law regardless of its specific skill tag —
# domain-fallback matching stays valid there. Skip the fallback only for
# domains on this list; skill-tag and alias matching still apply as normal,
# so a genuinely relevant course (one that actually teaches a matched skill)
# is unaffected.
_DOMAIN_MATCH_TOO_BROAD = {"web development"}


def _matches_interest(course: Course, interests_lower: set[str]) -> bool:
    # Skill tags and domain are checked separately (not folded into one
    # `fields` list) so the domain-fallback can be selectively skipped for
    # broad domains (see _DOMAIN_MATCH_TOO_BROAD) without weakening skill-tag
    # matching, which stays trustworthy regardless of domain.
    #
    # Title/description text was tried and dropped: a short interest word can
    # appear incidentally in an unrelated course's free-text description
    # (e.g. "systems") and pull in exactly the kind of irrelevant result this
    # filter exists to keep out.
    #
    # Substring containment also requires both sides to clear
    # _MIN_MATCH_LENGTH: a single-letter skill tag like "c" (the language,
    # from CS50) is trivially "contained in" almost any phrase — e.g.
    # "content creation" — which produced exactly the kind of false, unrelated
    # match this filter exists to prevent.
    skill_fields = [s.lower() for s in course.skills_taught]
    domain_field = course.domain.lower()
    for interest in interests_lower:
        if len(interest) < _MIN_MATCH_LENGTH:
            continue
        for field in skill_fields:
            if len(field) < _MIN_MATCH_LENGTH:
                continue
            if interest in field or field in interest:
                return True
        if (
            domain_field not in _DOMAIN_MATCH_TOO_BROAD
            and len(domain_field) >= _MIN_MATCH_LENGTH
            and (interest in domain_field or domain_field in interest)
        ):
            return True
        if _alias_tags_for(interest, skill_fields):
            return True
    return False


def _alias_tags_for(interest: str, skill_fields: list[str]) -> bool:
    # Matched on whole words, not raw substring: Gemini phrases the same
    # interest inconsistently ("backend", "backend development", "backend
    # dev"), and the alias table only has "backend" as a key. A raw substring
    # check (`"api" in interest`) would also wrongly fire on an unrelated
    # interest like "capital markets", which literally contains "api" as
    # letters 2-4 of "capital" — word-splitting avoids that false positive
    # while still catching "backend" inside "backend development".
    interest_words = interest.split()
    for alias_key, alias_tags in _INTEREST_ALIASES.items():
        if alias_key in interest_words and any(tag in skill_fields for tag in alias_tags):
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

    def base_eligible(course: Course) -> bool:
        return course.id not in completed and _level_allowed(course, profile.experience_level)

    level_eligible = [c for c in courses if base_eligible(c)]

    # With no stated interests there's no relevance signal to filter by, so
    # the full eligible pool is the honest answer. With stated interests, a
    # course must actually match one to be something the learner *wants* — a
    # short, correct path beats one padded with whatever the embedding
    # ranker considers "closest of what's left" (see docs/adr/0003).
    if interests_lower:
        wanted = [c for c in level_eligible if _matches_interest(c, interests_lower)]
        if not wanted:
            return []
    else:
        wanted = level_eligible

    wanted_ids = {c.id for c in wanted}

    # Prerequisites are still real: someone can't jump straight into
    # Node.js/Express without JS fundamentals. But a hard exclusion for
    # "hasn't completed a prereq-teaching course yet" used to drop the
    # learner's actual target course from the path entirely, backfilled by
    # whatever unrelated-but-interest-matching courses were left — a learner
    # asking for backend work got two frontend courses padding out a path
    # that never mentioned Node.js at all. Build the path greedily instead: a
    # wanted course unlocks once its prerequisites are covered by a
    # completed course or by another course already pulled in. When nothing
    # currently in the path teaches a still-missing prerequisite, pull in
    # one course from the wider level-eligible pool that does — even if it
    # doesn't itself match the stated interest (a generic JS-fundamentals
    # course isn't "about backend," but it's still the necessary first step
    # toward the Node.js course that is) — and only ever because it supplies
    # a skill something already in the path is still missing, never on its
    # own initiative.
    result: List[Course] = []
    result_ids: set[str] = set()
    frontier_skills = set(known_skills)
    pending = list(wanted)

    progressed = True
    while progressed and pending:
        progressed = False
        still_pending = []
        for course in pending:
            if _prerequisites_met(course, frontier_skills):
                result.append(course)
                result_ids.add(course.id)
                frontier_skills.update(s.lower() for s in course.skills_taught)
                progressed = True
            else:
                still_pending.append(course)
        pending = still_pending

        if not progressed and pending:
            missing = {
                p.lower()
                for course in pending
                for p in course.prerequisite_skills
                if p.lower() not in frontier_skills
            }
            for course in level_eligible:
                if course.id in result_ids or course.id in wanted_ids:
                    continue
                taught = {s.lower() for s in course.skills_taught}
                if taught & missing and _prerequisites_met(course, frontier_skills):
                    result.append(course)
                    result_ids.add(course.id)
                    frontier_skills.update(taught)
                    progressed = True

    return result


def _course_text(course: Course) -> str:
    skills = ", ".join(course.skills_taught)
    return f"{course.title}. {course.description} Skills: {skills}"


def _build_rationale(course: Course, interests_lower: set[str]) -> str:
    skill_fields = [s.lower() for s in course.skills_taught]
    matched = [s for s in course.skills_taught if s.lower() in interests_lower]
    if not matched:
        # A course can be selected purely via an interest alias (e.g.
        # "backend" -> nodejs) with no literal string overlap — without this,
        # the rationale fell back to a generic "builds skills toward your
        # {domain} goal" line that never mentioned the actual matched skill,
        # reading as unrelated even when the course was chosen for exactly
        # the right reason.
        for interest in interests_lower:
            interest_words = interest.split()
            for alias_key, alias_tags in _INTEREST_ALIASES.items():
                if alias_key not in interest_words:
                    continue
                for alias_tag in alias_tags:
                    if alias_tag in skill_fields:
                        matched = [s for s in course.skills_taught if s.lower() == alias_tag]
                        break
                if matched:
                    break
            if matched:
                break
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
