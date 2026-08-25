"""Test-only environment setup.

Routes now wire in app.db (for the recommendations/explain endpoints), which
builds its async engine from DATABASE_URL at import time. The test suite
never touches a real database — every test mocks the DB session or the
route-level fetch helpers — but importing app.main still requires a
syntactically valid DATABASE_URL to exist. Set harmless placeholders here so
`pytest` doesn't depend on a local .env file.
"""

import os

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/postgres"
)
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-api-key")
