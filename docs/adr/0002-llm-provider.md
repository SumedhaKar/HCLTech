# 0002. LLM provider: Gemini API free tier, not Anthropic

Status: Accepted
Date: 2026-08-22

## Context
The app needs an LLM for chat-based profile extraction and recommendation explanations, on a $0 budget. The author initially assumed Claude.ai/Claude Pro access meant Anthropic API access — it doesn't; those are separate products. Researched current (Aug 2026) free-tier terms across Anthropic, Gemini, Groq, OpenRouter, and Mistral before deciding — see sources below.

## Decision
Use Google Gemini API (via AI Studio) as the primary LLM, for both structured extraction and explanation generation, plus embeddings for recommendation similarity (ADR 0003). Groq is the documented fallback if Gemini is rate-limited during judging.

## Why not Anthropic
The Anthropic API has no standing free tier — only a small, one-time trial credit that expires once spent and requires a payment method to continue. That's a bad fit for a demo whose exact judging moment isn't controlled by the author; the credit could be exhausted in development before judging happens.

## Consequences
- Gemini free tier: card-free, ~15 RPM / up to ~1500 RPD on Flash-Lite, no expiry — sufficient for judged-demo traffic.
- Gemini's free-tier ToS may use traffic for model training/product improvement; acceptable for this use case (no sensitive data), noted here in case that changes.
- Groq is the fallback path — same architecture, different API client, kept as a documented option rather than implemented up front.

Sources: https://ai.google.dev/gemini-api/docs/rate-limits · https://platform.claude.com/docs/en/about-claude/pricing · https://www.eesel.ai/blog/groq-pricing
