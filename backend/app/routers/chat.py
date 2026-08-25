"""Chat/AI routes. See docs/adr/0004-service-boundary-and-schema-ownership.md
for why chat/AI endpoints live in FastAPI rather than Next.js.
"""

from __future__ import annotations

import uuid
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.services.gemini_explain import (
    GeminiExplainError,
    OtherPathItem,
    PathItemContext,
    explain_recommendation,
)
from app.services.gemini_intake import GeminiIntakeError, run_intake_turn

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatIntakeRequest(BaseModel):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)


class LearnerProfilePatch(BaseModel):
    """Partial learner profile, field names matching the frontend's
    LearnerProfile shape (see docs/contract/api-contract.md), not the
    snake_case columns of learner_profiles in supabase/migrations/0001_init.sql.
    """

    model_config = ConfigDict(extra="ignore")

    goal: Optional[str] = None
    interests: Optional[List[str]] = None
    experienceLevel: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    completedCourseIds: Optional[List[str]] = None
    timeBudgetHoursPerWeek: Optional[int] = None


class ChatIntakeResponse(BaseModel):
    reply: str
    profilePatch: LearnerProfilePatch
    profileComplete: bool


@router.post("/intake", response_model=ChatIntakeResponse)
async def chat_intake(payload: ChatIntakeRequest) -> ChatIntakeResponse:
    try:
        result = run_intake_turn(
            message=payload.message,
            history=[turn.model_dump() for turn in payload.history],
        )
    except GeminiIntakeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        profile_patch = LearnerProfilePatch(**result.get("profilePatch", {}))
    except Exception as exc:  # invalid/unexpected shape from the model
        raise HTTPException(
            status_code=502, detail=f"Gemini returned an unusable profile patch: {exc}"
        ) from exc

    return ChatIntakeResponse(
        reply=result.get("reply", ""),
        profilePatch=profile_patch,
        profileComplete=bool(result.get("profileComplete", False)),
    )


class ChatExplainRequest(BaseModel):
    pathItemId: str
    question: str


class ChatExplainResponse(BaseModel):
    answer: str


async def _fetch_explain_context(db: AsyncSession, path_item_id: str) -> Optional[PathItemContext]:
    row = (
        await db.execute(
            text(
                """
                select lpi.sequence_order, lpi.milestone_label, lpi.rationale,
                       lpi.learning_path_id,
                       c.title, c.description, c.domain, c.level,
                       c.skills_taught, c.prerequisite_skills,
                       lp.goal
                from learning_path_items lpi
                join courses c on c.id = lpi.course_id
                join learning_paths lp on lp.id = lpi.learning_path_id
                where lpi.id = :path_item_id
                """
            ),
            {"path_item_id": path_item_id},
        )
    ).mappings().first()

    if row is None:
        return None

    sibling_rows = (
        await db.execute(
            text(
                """
                select c.title, lpi.sequence_order, lpi.milestone_label
                from learning_path_items lpi
                join courses c on c.id = lpi.course_id
                where lpi.learning_path_id = :learning_path_id
                order by lpi.sequence_order
                """
            ),
            {"learning_path_id": row["learning_path_id"]},
        )
    ).mappings().all()

    other_items = [
        OtherPathItem(
            course_title=sibling["title"],
            sequence_order=sibling["sequence_order"],
            milestone_label=sibling["milestone_label"],
        )
        for sibling in sibling_rows
    ]

    return PathItemContext(
        course_title=row["title"],
        course_description=row["description"],
        course_domain=row["domain"],
        course_level=row["level"],
        skills_taught=list(row["skills_taught"] or []),
        prerequisite_skills=list(row["prerequisite_skills"] or []),
        milestone_label=row["milestone_label"],
        sequence_order=row["sequence_order"],
        rationale=row["rationale"],
        path_goal=row["goal"],
        other_items=other_items,
    )


@router.post("/explain", response_model=ChatExplainResponse)
async def chat_explain(
    payload: ChatExplainRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatExplainResponse:
    try:
        item_uuid = str(uuid.UUID(payload.pathItemId))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="pathItemId is not a valid id") from exc

    context = await _fetch_explain_context(db, item_uuid)
    if context is None:
        raise HTTPException(status_code=404, detail="Learning path item not found")

    try:
        answer = explain_recommendation(question=payload.question, context=context)
    except GeminiExplainError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatExplainResponse(answer=answer)
