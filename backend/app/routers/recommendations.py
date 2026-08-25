"""Recommendation-generation routes. See docs/adr/0003-recommendation-engine-design.md
for the hybrid rule-based + embedding-similarity design this wraps, and
docs/adr/0004-service-boundary-and-schema-ownership.md for why this lives in
FastAPI rather than Next.js.
"""

from __future__ import annotations

import uuid
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.services.embeddings import GeminiEmbeddingError
from app.services.gemini_client import GeminiError
from app.services.recommender import Course, LearnerProfile, build_learning_path

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class GenerateRecommendationsRequest(BaseModel):
    learnerId: str


class PathItem(BaseModel):
    id: str
    courseId: str
    sequenceOrder: int
    milestoneLabel: Optional[str] = None
    rationale: Optional[str] = None
    status: Literal["not_started", "in_progress", "completed"]


class LearningPathResponse(BaseModel):
    id: str
    goal: str
    items: List[PathItem]


async def _fetch_profile(db: AsyncSession, learner_id: str) -> Optional[LearnerProfile]:
    row = (
        await db.execute(
            text(
                """
                select goal, interests, experience_level, completed_course_ids,
                       time_budget_hours_per_week
                from learner_profiles
                where learner_id = :learner_id
                """
            ),
            {"learner_id": learner_id},
        )
    ).mappings().first()

    if row is None:
        return None

    return LearnerProfile(
        goal=row["goal"] or "",
        interests=list(row["interests"] or []),
        experience_level=row["experience_level"] or "beginner",
        completed_course_ids=[str(cid) for cid in (row["completed_course_ids"] or [])],
        time_budget_hours_per_week=row["time_budget_hours_per_week"],
    )


async def _fetch_courses(db: AsyncSession) -> List[Course]:
    rows = (
        await db.execute(
            text(
                """
                select id, title, description, domain, level, skills_taught,
                       prerequisite_skills
                from courses
                """
            )
        )
    ).mappings().all()

    return [
        Course(
            id=str(row["id"]),
            title=row["title"],
            description=row["description"],
            domain=row["domain"],
            level=row["level"],
            skills_taught=list(row["skills_taught"] or []),
            prerequisite_skills=list(row["prerequisite_skills"] or []),
        )
        for row in rows
    ]


@router.post("/generate", response_model=LearningPathResponse)
async def generate_recommendations(
    payload: GenerateRecommendationsRequest,
    db: AsyncSession = Depends(get_db),
) -> LearningPathResponse:
    try:
        learner_uuid = str(uuid.UUID(payload.learnerId))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="learnerId is not a valid id") from exc

    profile = await _fetch_profile(db, learner_uuid)
    if profile is None:
        raise HTTPException(status_code=404, detail="Learner profile not found")
    if not profile.goal or not profile.interests or not profile.experience_level:
        raise HTTPException(
            status_code=422,
            detail="Learner profile is incomplete — finish chat intake before generating a path",
        )

    courses = await _fetch_courses(db)
    if not courses:
        raise HTTPException(status_code=422, detail="No courses available to recommend")

    try:
        path_entries = build_learning_path(profile, courses)
    except (GeminiEmbeddingError, GeminiError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not path_entries:
        raise HTTPException(
            status_code=422,
            detail="No suitable courses found for this learner's profile",
        )

    path_id = str(uuid.uuid4())
    await db.execute(
        text("insert into learning_paths (id, learner_id, goal) values (:id, :learner_id, :goal)"),
        {"id": path_id, "learner_id": learner_uuid, "goal": profile.goal},
    )

    items: List[PathItem] = []
    for entry in path_entries:
        item_id = str(uuid.uuid4())
        await db.execute(
            text(
                """
                insert into learning_path_items
                    (id, learning_path_id, course_id, sequence_order, milestone_label, rationale, status)
                values
                    (:id, :learning_path_id, :course_id, :sequence_order, :milestone_label, :rationale, 'not_started')
                """
            ),
            {
                "id": item_id,
                "learning_path_id": path_id,
                "course_id": entry.course.id,
                "sequence_order": entry.sequence_order,
                "milestone_label": entry.milestone_label,
                "rationale": entry.rationale,
            },
        )
        items.append(
            PathItem(
                id=item_id,
                courseId=entry.course.id,
                sequenceOrder=entry.sequence_order,
                milestoneLabel=entry.milestone_label,
                rationale=entry.rationale,
                status="not_started",
            )
        )

    await db.commit()

    return LearningPathResponse(id=path_id, goal=profile.goal, items=items)
