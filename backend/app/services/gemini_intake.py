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

SYSTEM_INSTRUCTION = """You are the intake assistant for PathFinder, a learning-path \
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

Rules:
1. Only include a field in profilePatch if the conversation actually supports it. Never \
guess or invent values — omit fields you don't have evidence for.
2. If the learner's goal or experience level is still unclear, ask one short, friendly \
clarifying question about it in "reply" — one question at a time, don't interrogate.
3. Set profileComplete to true only once you know the goal, the experience level, AND \
at least one interest. Otherwise set it to false.
4. "reply" is always a natural, conversational response to the learner's latest message. \
Never mention that you are extracting structured data or reference field names.

Respond with JSON only, matching the provided schema."""

_PROFILE_PATCH_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "goal": {"type": "STRING"},
        "interests": {"type": "ARRAY", "items": {"type": "STRING"}},
        "experienceLevel": {
            "type": "STRING",
            "enum": ["beginner", "intermediate", "advanced"],
        },
        "completedCourseIds": {"type": "ARRAY", "items": {"type": "STRING"}},
        "timeBudgetHoursPerWeek": {"type": "INTEGER"},
    },
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

    return {
        "reply": data.get("reply", ""),
        "profilePatch": data.get("profilePatch") or {},
        "profileComplete": bool(data.get("profileComplete", False)),
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
