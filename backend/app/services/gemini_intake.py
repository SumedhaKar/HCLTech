"""Gemini-backed structured extraction for the chat-intake flow.

Kept separate from the router (app/routers/chat.py) so it can be unit-tested
in isolation, with the actual Gemini call monkeypatched out — see
backend/tests/test_chat_intake.py. See docs/adr/0002-llm-provider.md for why
this calls Gemini rather than another provider.
"""

from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

from app.services.gemini_client import GeminiError, get_client

MODEL_NAME = "gemini-3.5-flash-lite"

# The catalog's actual domain taxonomy (see supabase/seed/0001_courses.sql and
# 0002_courses_expansion.sql — keep this in sync if a domain is ever added,
# renamed, or removed there). Given to the model so it can ground a learner's
# specific, free-text interest ("forensic science", "criminal lawyer") in a
# domain the recommender's catalog actually has, rather than only extracting
# the learner's own wording verbatim. The recommender matches interests
# against course domain and skill tags via substring, so a niche interest
# with no literal overlap with any tag (e.g. "forensic" against the Law
# domain's tags) previously matched nothing at all, even when the catalog
# has clearly relevant courses one level up (general Law foundations).
CATALOG_DOMAINS = [
    "Programming Fundamentals",
    "Web Development",
    "Data Science & Machine Learning",
    "Cloud & DevOps",
    "Cybersecurity",
    "Mobile Development",
    "UX & Product Design",
    "Marketing",
    "Business & Management",
    "Finance & Accounting",
    "Design",
    "Basic Sciences",
    "Bio Sciences",
    "Law",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
]

SYSTEM_INSTRUCTION = f"""You are the intake assistant for PathFinder, a learning-path \
recommender. Hold a short, friendly conversation with a learner to figure out enough \
about them to build a personalized course path, then extract what you've learned into \
structured fields on every turn.

The fields you are extracting (a partial learner profile):
- goal: a short free-text description of what the learner wants to achieve.
- interests: a list of topics, technologies, or domains the learner is interested in.
- experienceLevel: one of "beginner", "intermediate", "advanced".
- completedCourseIds: a list of course ids the learner explicitly names as already \
completed (leave empty unless they name specific ids).
- timeBudgetHoursPerWeek: an integer number of hours per week the learner can study.

The course catalog is organized into these domains only: {", ".join(CATALOG_DOMAINS)}.

Rules:
1. profilePatch must always include every field listed above, on every turn, with no \
exceptions. If the conversation doesn't yet support a value for a field, set it to null \
(or an empty array for interests/completedCourseIds) — do not leave it out. Never guess \
or invent a value just to fill a field: a wrong invented value is worse than null.
2. If the learner's goal or experience level is still unclear, ask one short, friendly \
clarifying question about it in "reply" — one question at a time, don't interrogate.
3. Set profileComplete to true only once you know the goal, the experience level, AND \
at least one interest. Otherwise set it to false.
4. "reply" is always a natural, conversational response to the learner's latest message. \
Never mention that you are extracting structured data or reference field names.
5. In "interests", always include the learner's own specific words (e.g. "forensic \
science"), AND ALSO add the single closest-matching domain name from the fixed list \
above as its own extra entry, so a niche interest still finds courses even when the \
catalog has nothing that specific — e.g. a learner set on becoming a criminal lawyer who \
mentions forensic science should get interests including both "forensic science" and \
"Law". Only add a domain when one is a genuine, confident fit; never force one in.

Respond with JSON only, matching the provided schema."""

_PROFILE_PATCH_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "goal": {"type": "STRING", "nullable": True},
        "interests": {"type": "ARRAY", "items": {"type": "STRING"}},
        "experienceLevel": {
            "type": "STRING",
            "enum": ["beginner", "intermediate", "advanced"],
            "nullable": True,
        },
        "completedCourseIds": {"type": "ARRAY", "items": {"type": "STRING"}},
        "timeBudgetHoursPerWeek": {"type": "INTEGER", "nullable": True},
    },
    "required": [
        "goal",
        "interests",
        "experienceLevel",
        "completedCourseIds",
        "timeBudgetHoursPerWeek",
    ],
}

# response_schema must be a plain dict here, not a types.Schema instance — this
# SDK version's t_schema() only passes dicts through untouched; anything else
# gets routed through `.model_json_schema()`, which (since Schema is itself a
# pydantic model) describes Schema's own shape instead of ours and crashes.
# See google/genai/_transformers.py: t_schema() / process_schema().
_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "reply": {"type": "STRING"},
        "profilePatch": _PROFILE_PATCH_SCHEMA,
        "profileComplete": {"type": "BOOLEAN"},
    },
    "required": ["reply", "profilePatch", "profileComplete"],
}


class GeminiIntakeError(GeminiError):
    """Raised when the Gemini call fails or returns something we can't parse."""


def _get_client() -> genai.Client:
    try:
        return get_client()
    except GeminiError as exc:
        raise GeminiIntakeError(str(exc)) from exc


def _build_contents(history: list[dict[str, str]], message: str) -> list[types.Content]:
    contents: list[types.Content] = []
    for turn in history:
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=turn.get("content", ""))])
        )
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
    return contents


def _parse_response(raw_text: str | None) -> dict[str, Any]:
    if not raw_text:
        raise GeminiIntakeError("Gemini returned an empty response")
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise GeminiIntakeError(f"Gemini returned non-JSON output: {exc}") from exc

    if not isinstance(data, dict):
        raise GeminiIntakeError("Gemini response JSON was not an object")

    profile_patch = data.get("profilePatch") or {}

    # profileComplete is derived here rather than trusted from the model's own
    # boolean: Gemini has been observed reporting profileComplete=true in the
    # same response where experienceLevel is missing from profilePatch, which
    # contradicts the completion rule in SYSTEM_INSTRUCTION. Recomputing it
    # from the patch that was actually returned makes the two fields always
    # consistent, regardless of what the model claims.
    profile_complete = bool(profile_patch.get("goal")) and bool(
        profile_patch.get("experienceLevel")
    ) and len(profile_patch.get("interests") or []) > 0

    return {
        "reply": data.get("reply", ""),
        "profilePatch": profile_patch,
        "profileComplete": profile_complete,
    }


def run_intake_turn(message: str, history: list[dict[str, str]]) -> dict[str, Any]:
    """Send the conversation so far to Gemini and return the extracted turn.

    Returns a dict with keys "reply", "profilePatch", and "profileComplete" —
    the same shape the /chat/intake route serializes back to the frontend.
    Raises GeminiIntakeError on any failure (missing key, network error,
    unparseable response) so the router can turn it into a clean 5xx.
    """

    client = _get_client()
    contents = _build_contents(history, message)

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.2,
            ),
        )
    except Exception as exc:  # noqa: BLE001 - genai raises several distinct error types
        raise GeminiIntakeError(f"Gemini call failed: {exc}") from exc

    return _parse_response(response.text)
