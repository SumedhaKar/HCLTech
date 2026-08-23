"""Gemini-backed free-text explanations for POST /chat/explain.

Answers a learner's follow-up question about one specific learning-path
item ("why this course," "why not X instead") using the item's own
rationale plus the rest of the path as context. Kept separate from the
router (app/routers/chat.py) so it can be unit-tested with the Gemini call
monkeypatched out, same pattern as gemini_intake.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from google.genai import types

from app.services.gemini_client import GeminiError, get_client

MODEL_NAME = "gemini-3.5-flash-lite"

SYSTEM_INSTRUCTION = """You are PathFinder's recommendation explainer. A learner is looking \
at one specific course in their personalized learning path and has a question about it — \
often "why this course" or "why not some other course instead."

Use the course details and path context you're given to answer conversationally and \
specifically. Reference the actual course title, skills, or the learner's stated goal where \
relevant. If the learner asks about an alternative course that isn't in view, answer using \
general reasoning about their goal and this course's role in the path rather than inventing \
facts about a course you have no details for.

Keep the answer short — a few sentences, plain text, no markdown, no headers."""


@dataclass
class OtherPathItem:
    course_title: str
    sequence_order: int
    milestone_label: str | None = None


@dataclass
class PathItemContext:
    course_title: str
    course_description: str
    course_domain: str
    course_level: str
    skills_taught: List[str]
    prerequisite_skills: List[str]
    milestone_label: str | None
    sequence_order: int
    rationale: str | None
    path_goal: str
    other_items: List[OtherPathItem] = field(default_factory=list)


class GeminiExplainError(GeminiError):
    """Raised when the Gemini call fails or returns something unusable."""


def _get_client():
    try:
        return get_client()
    except GeminiError as exc:
        raise GeminiExplainError(str(exc)) from exc


def _build_prompt(question: str, context: PathItemContext) -> str:
    lines = [
        f"Learner's goal: {context.path_goal}",
        "",
        f"The course in question (step {context.sequence_order} of the path"
        + (f", milestone \"{context.milestone_label}\"" if context.milestone_label else "")
        + "):",
        f"- Title: {context.course_title}",
        f"- Domain: {context.course_domain}",
        f"- Level: {context.course_level}",
        f"- Description: {context.course_description}",
        f"- Skills taught: {', '.join(context.skills_taught) or 'none listed'}",
        f"- Prerequisite skills: {', '.join(context.prerequisite_skills) or 'none'}",
    ]
    if context.rationale:
        lines.append(f"- Why it was recommended: {context.rationale}")

    if context.other_items:
        lines.append("")
        lines.append("The rest of the learner's path, in order:")
        for item in context.other_items:
            marker = " (this course)" if item.sequence_order == context.sequence_order else ""
            label = f" — {item.milestone_label}" if item.milestone_label else ""
            lines.append(f"{item.sequence_order}. {item.course_title}{label}{marker}")

    lines.append("")
    lines.append(f"Learner's question: {question}")

    return "\n".join(lines)


def explain_recommendation(*, question: str, context: PathItemContext) -> str:
    """Send the question + path-item context to Gemini and return its answer.

    Raises GeminiExplainError on any failure so the router can turn it into
    a clean 5xx.
    """

    client = _get_client()
    prompt = _build_prompt(question, context)

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.3,
            ),
        )
    except Exception as exc:  # noqa: BLE001 - genai raises several distinct error types
        raise GeminiExplainError(f"Gemini call failed: {exc}") from exc

    answer = response.text
    if not answer or not answer.strip():
        raise GeminiExplainError("Gemini returned an empty response")
    return answer.strip()
