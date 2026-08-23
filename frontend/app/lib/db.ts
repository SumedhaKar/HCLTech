import postgres from "postgres";

// Single lightweight postgres.js client, reused across requests/hot reloads.
// No ORM here on purpose — see docs/adr/0004-service-boundary-and-schema-ownership.md.
// Schema is owned by supabase/migrations/, this file only queries it.

type Sql = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __pathfinderSql: Sql | undefined;
}

let cachedSql: Sql | undefined = globalThis.__pathfinderSql;

export function getSql(): Sql {
  if (cachedSql) return cachedSql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy frontend/.env.local.example to " +
        "frontend/.env.local and fill in the Supabase Postgres connection string."
    );
  }

  cachedSql = postgres(connectionString, {
    ssl: "require",
    max: 5,
  });

  // Reuse the pool across dev-server hot reloads instead of leaking connections.
  if (process.env.NODE_ENV !== "production") {
    globalThis.__pathfinderSql = cachedSql;
  }

  return cachedSql;
}
