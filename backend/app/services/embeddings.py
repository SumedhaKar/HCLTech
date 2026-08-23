"""Gemini embeddings for the recommendation engine's similarity ranking.

See docs/adr/0003-recommendation-engine-design.md for why this calls the
Gemini embeddings API rather than bundling a local model.
"""

from __future__ import annotations

import math
from typing import List

from app.services.gemini_client import GeminiError, get_client

EMBEDDING_MODEL = "gemini-embedding-001"


class GeminiEmbeddingError(GeminiError):
    """Raised when the Gemini embeddings call fails or returns something unusable."""


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a batch of texts, in order, via a single Gemini call.

    Returns one vector per input text, in the same order. Raises
    GeminiEmbeddingError on any failure (missing key, network error,
    mismatched/empty response) so callers can turn it into a clean 5xx.
    """

    if not texts:
        return []

    try:
        client = get_client()
    except GeminiError as exc:
        raise GeminiEmbeddingError(str(exc)) from exc

    try:
        response = client.models.embed_content(model=EMBEDDING_MODEL, contents=texts)
    except Exception as exc:  # noqa: BLE001 - genai raises several distinct error types
        raise GeminiEmbeddingError(f"Gemini embedding call failed: {exc}") from exc

    embeddings = response.embeddings or []
    if len(embeddings) != len(texts):
        raise GeminiEmbeddingError(
            "Gemini returned a different number of embeddings than requested"
        )

    vectors = [list(e.values) if e.values else [] for e in embeddings]
    if any(not vector for vector in vectors):
        raise GeminiEmbeddingError("Gemini returned an empty embedding vector")
    return vectors


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
