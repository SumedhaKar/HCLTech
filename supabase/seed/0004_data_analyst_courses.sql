-- Seed addition: the catalog had zero Excel content anywhere — a real gap
-- for a "data analyst" goal, which needs SQL and Excel specifically, not
-- the data-science/ML content the Data Science & Machine Learning domain
-- otherwise skews toward. Title/description/source_url verified against the
-- real course page before being added, not fabricated. Run after
-- 0001_courses.sql, 0002_courses_expansion.sql, and
-- 0003_ai_engineering_courses.sql have been applied.

insert into courses (title, description, domain, level, duration_hours, skills_taught, prerequisite_skills, source_url) values

('Excel Skills for Business Specialization', 'Macquarie University''s specialization on spreadsheets as an actual analysis tool — formulas, pivot tables, and dashboards, not just cell formatting.', 'Business & Management', 'beginner', 45, ARRAY['excel'], ARRAY[]::text[], 'https://www.coursera.org/specializations/excel');
