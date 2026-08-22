-- Initial schema. See docs/adr/0004-service-boundary-and-schema-ownership.md —
-- this file is the single source of truth for the schema; neither the Next.js
-- nor the FastAPI side auto-generates or auto-migrates it.

create table courses (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    domain text not null,
    level text not null check (level in ('beginner', 'intermediate', 'advanced')),
    duration_hours integer not null,
    skills_taught text[] not null default '{}',
    prerequisite_skills text[] not null default '{}',
    source_url text,
    created_at timestamptz not null default now()
);

create table learners (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    created_at timestamptz not null default now()
);

-- Single seeded mock learner (ADR 0005) — no auth for MVP.
insert into learners (id, display_name)
values ('00000000-0000-0000-0000-000000000001', 'Demo Learner');

create table learner_profiles (
    learner_id uuid primary key references learners(id) on delete cascade,
    goal text,
    interests text[] not null default '{}',
    experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
    completed_course_ids uuid[] not null default '{}',
    time_budget_hours_per_week integer,
    updated_at timestamptz not null default now()
);

create table learning_paths (
    id uuid primary key default gen_random_uuid(),
    learner_id uuid not null references learners(id) on delete cascade,
    goal text not null,
    created_at timestamptz not null default now()
);

create table learning_path_items (
    id uuid primary key default gen_random_uuid(),
    learning_path_id uuid not null references learning_paths(id) on delete cascade,
    course_id uuid not null references courses(id),
    sequence_order integer not null,
    milestone_label text,
    rationale text,
    status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
    unique (learning_path_id, sequence_order)
);

create index on learning_path_items (learning_path_id);
create index on courses (domain);
