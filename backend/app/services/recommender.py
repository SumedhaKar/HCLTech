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
    # A "full stack" goal spans frontend, backend, and database at once — no
    # single existing alias covers that, and it doesn't reliably land on one
    # catalog domain either (Gemini's domain-grounding for "full stack
    # developer" has landed on both "Web Development" and "Programming
    # Fundamentals" across otherwise-identical calls). Mapping it directly to
    # the real cross-cutting skill set removes that non-determinism instead
    # of depending on it.
    "full stack": ("html-css", "javascript-basics", "react", "nodejs", "express", "mongodb", "sql-basics"),
    "full-stack": ("html-css", "javascript-basics", "react", "nodejs", "express", "mongodb", "sql-basics"),
    "fullstack": ("html-css", "javascript-basics", "react", "nodejs", "express", "mongodb", "sql-basics"),
    # A "data analyst" goal grounds to "Data Science & Machine Learning" the
    # same non-deterministic way "full stack developer" did — and that
    # domain's actual courses (Pandas, ML Specialization, PyTorch...) skew
    # toward data science/ML, not the SQL and Excel a data analyst role
    # specifically needs; SQL lives under Programming Fundamentals, a
    # different domain entirely, so it never got pulled in on its own.
    "data analyst": ("sql-basics", "excel", "data-analysis", "pandas"),
    "data analytics": ("sql-basics", "excel", "data-analysis", "pandas"),
    # Gemini phrased the identical goal as "data analyst" on one call and
    # "data analysis" on another — a real, observed non-determinism, not a
    # hypothetical. Neither the word-level nor the multi-word substring
    # check bridges "analyst" and "analysis"; they're different English
    # words, not a punctuation/spacing variant. Every phrasing actually seen
    # gets its own key rather than trying to normalize the difference away.
    "data analysis": ("sql-basics", "excel", "data-analysis", "pandas"),
    # A "web dev"/"web developer" goal is at least as broad as "full stack"
    # (it's the same skill spread in this catalog — html/css through
    # Node/React) but has no alias of its own, and "Web Development" domain
    # matching is deliberately blocked (see _DOMAIN_MATCH_TOO_BROAD) since a
    # narrower interest like "backend" shouldn't pull in CSS-only courses
    # from that domain. That block has the correct effect for "backend" but
    # the opposite of the correct effect here — "web dev" is the one goal
    # that legitimately wants the whole domain — so it needs its own direct
    # route to the real skill set, same as "full stack".
    #
    # Deliberately does NOT include a "web development" key: Gemini always
    # appends that exact domain name as a secondary grounding interest
    # alongside whatever the learner actually said (see gemini_intake.py),
    # including for narrow goals like "backend dev" — aliasing it to the
    # full breadth of web skills would silently re-widen exactly the
    # "backend shouldn't get CSS-only courses" case _DOMAIN_MATCH_TOO_BROAD
    # exists to prevent. "web dev"/"web developer" are the learner's own
    # words and don't have that collision.
    "web dev": ("html-css", "javascript-basics", "react", "nodejs", "express", "mongodb", "sql-basics"),
    "web developer": ("html-css", "javascript-basics", "react", "nodejs", "express", "mongodb", "sql-basics"),
}

# Domains whose courses span genuinely distinct skill clusters, so a bare
# domain-name match is too weak a relevance signal on its own — contrast
# with a domain like Law, where every course genuinely is about law
# regardless of its specific skill tag, so domain-fallback matching stays
# valid there. Skip the fallback only for domains on this list; skill-tag
# and alias matching still apply as normal, so a genuinely relevant course
# (one that actually teaches a matched skill) is unaffected.
#
# "web development" — contains courses that are pure frontend (CSS Grid &
# Flexbox, skills=["html-css"]) alongside backend/full-stack ones (Node.js/
# Express/MongoDB). A Gemini-appended "Web Development" grounding interest
# (added for a "backend dev" goal, since the catalog's domain list has no
# narrower "Backend" bucket) let CSS-only courses ride in on it.
#
# "programming fundamentals" — bundles CS50 (C/algorithms), Python for
# Everybody, JS Algorithms & Data Structures, Git/GitHub, a DSA
# specialization, and Java OOP: six unrelated languages/topics under one
# domain name. A "full stack developer" goal that happened to get
# domain-grounded here (rather than to Web Development, on a different
# Gemini call for the identical input) matched every course in the domain
# and crowded out the actually-relevant Web Development/database content
# entirely — the same failure mode as Web Development, on a different
# domain, from the exact same underlying cause.
_DOMAIN_MATCH_TOO_BROAD = {"web development", "programming fundamentals"}


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
    if _matches_interest_specifically(course, interests_lower):
        return True

    domain_field = course.domain.lower()
    # The broad-domain block exists to stop a domain name from being a
    # bystander match: Gemini appends "Web Development" as grounding context
    # even for a narrower goal like "backend", and without the block a
    # CSS-only course would ride in on that shared domain name alone. But
    # when the broad domain name is the LEARNER'S ONLY stated interest (e.g.
    # interests == ["web development", "Web Development"] — the same goal,
    # re-summarized with different casing across two Gemini calls, nothing
    # else), there's no narrower interest left for the block to protect, and
    # it was producing "no courses found" for a learner who asked for exactly
    # that domain. Skip the block only in that single-interest case.
    domain_is_sole_interest = interests_lower == {domain_field}
    for interest in interests_lower:
        if len(interest) < _MIN_MATCH_LENGTH:
            continue
        if (
            (domain_field not in _DOMAIN_MATCH_TOO_BROAD or domain_is_sole_interest)
            and len(domain_field) >= _MIN_MATCH_LENGTH
            and (interest in domain_field or domain_field in interest)
        ):
            return True
    return False


def _matches_interest_specifically(course: Course, interests_lower: set[str]) -> bool:
    # Skill-tag substring or alias match only — no domain-name fallback. Used
    # both by _matches_interest (as one of two ways in) and, separately, by
    # build_learning_path to rank a real skill-level match ahead of a course
    # that only got in on a domain-name coincidence (see build_learning_path
    # for why: a bare domain match is a much weaker relevance signal, and
    # letting it outrank a specific match in the final ranked cut was exactly
    # how a "data analyst" path lost its SQL course to same-domain ML/DL
    # content that only shared a domain name, not actual relevance).
    skill_fields = [s.lower() for s in course.skills_taught]
    for interest in interests_lower:
        if len(interest) < _MIN_MATCH_LENGTH:
            continue
        for field in skill_fields:
            if len(field) < _MIN_MATCH_LENGTH:
                continue
            if interest in field or field in interest:
                return True
        if _alias_tags_for(interest, skill_fields):
            return True
    return False


def _alias_tags_for(interest: str, skill_fields: list[str]) -> bool:
    # Single-word keys are matched on whole words, not raw substring: Gemini
    # phrases the same interest inconsistently ("backend", "backend
    # development", "backend dev"), and the alias table only has "backend" as
    # a key. A raw substring check (`"api" in interest`) would also wrongly
    # fire on an unrelated interest like "capital markets", which literally
    # contains "api" as letters 2-4 of "capital" — word-splitting avoids that
    # false positive while still catching "backend" inside "backend
    # development".
    #
    # A multi-word key (e.g. "full stack") can never equal a single element
    # of that word list, so it's matched as a substring of the whole interest
    # instead — safe for a multi-word phrase, since unlike a short single
    # token it can't accidentally hide inside an unrelated single word.
    interest_words = interest.split()
    for alias_key, alias_tags in _INTEREST_ALIASES.items():
        if _alias_key_matches(alias_key, interest, interest_words) and any(
            tag in skill_fields for tag in alias_tags
        ):
            return True
    return False


def _alias_key_matches(alias_key: str, interest: str, interest_words: list[str]) -> bool:
    if " " not in alias_key:
        return alias_key in interest_words
    # A raw character-substring check (`alias_key in interest`) is too loose
    # for a multi-word key: "web dev" is a literal character-prefix of "web
    # development" (a real, distinct interest — the domain-grounding term
    # Gemini appends alongside narrower goals like "backend"), so it would
    # wrongly match there too. Matching on a contiguous WORD sequence
    # instead — "dev" must be its own whole word, not the start of
    # "development" — still catches "full stack" inside "full stack
    # developer" (a real phrasing variant) while correctly rejecting "web
    # dev" inside "web development".
    key_words = alias_key.split()
    span = len(key_words)
    return any(
        interest_words[i : i + span] == key_words
        for i in range(len(interest_words) - span + 1)
    )


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
                if not _alias_key_matches(alias_key, interest, interest_words):
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

    # A course that specifically teaches a matched skill is a stronger,
    # more trustworthy relevance signal than one that only shares a domain
    # name with an interest (e.g. a Gemini-appended grounding interest like
    # "Data Science & Machine Learning") — but embedding similarity doesn't
    # know that distinction, and can rank a domain-coincidence match above a
    # genuinely on-topic one. Concretely: for "become a data analyst",
    # Introduction to SQL (a real, specific match via the "data analyst"
    # alias) was getting outranked by same-domain ML/deep-learning courses
    # that only matched because they happen to share a domain name with the
    # broader grounding interest, and fell out of the top MAX_PATH_LENGTH
    # entirely. Specific matches are stable-sorted ahead of domain-only ones
    # before truncating, so real relevance always wins a spot over a
    # same-domain coincidence; embedding score still orders within each tier.
    interests_lower = {i.lower() for i in profile.interests if i}
    if interests_lower:
        ranked.sort(
            key=lambda pair: (
                0 if _matches_interest_specifically(pair[0], interests_lower) else 1,
                -pair[1],
            )
        )

    top = ranked[:MAX_PATH_LENGTH]

    # Order the path itself by level progression (beginner -> advanced), using
    # embedding-similarity score as the tiebreaker within a level, so the
    # result reads as a coherent learning sequence rather than a flat
    # relevance-sorted list.
    top.sort(key=lambda pair: (_LEVEL_RANK.get(pair[0].level, 0), -pair[1]))

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
