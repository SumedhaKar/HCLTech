"""Chat/AI routes. See docs/adr/0004-service-boundary-and-schema-ownership.md
for why chat/AI endpoints live in FastAPI rather than Next.js.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

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
