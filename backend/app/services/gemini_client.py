"""Shared Gemini client construction.

Pulled out of gemini_intake.py so the intake, embeddings, and explain
services all share one client instance and one base error type instead of
each rolling their own. See docs/adr/0002-llm-provider.md for why Gemini.
"""

from __future__ import annotations

from google import genai

from app.config import settings


class GeminiError(RuntimeError):
    """Base error for any Gemini API failure.

    Service-specific subclasses (GeminiIntakeError, GeminiEmbeddingError,
    GeminiExplainError) let each router catch just its own failures, while
    still being catchable here as the general case.
    """


_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise GeminiError("GEMINI_API_KEY is not configured")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client
