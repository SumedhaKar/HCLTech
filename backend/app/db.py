from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings

# Connects through Supabase's Supavisor pooler (session mode, port 5432) —
# Render is IPv4-only and Supabase's free-tier direct connection is IPv6-only.
# See docs/adr/0001-stack-selection.md.
engine = create_async_engine(settings.database_url, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
