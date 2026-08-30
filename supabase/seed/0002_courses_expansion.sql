-- Expansion seed: real, publicly known courses across 10 non-tech domains,
-- closing the gap between PRODUCT.md's stated "any domain" scope and the
-- tech-only catalog in 0001_courses.sql. Same sourcing standard as 0001:
-- real titles, original one-line summaries (not copied marketing copy), and
-- a real external source_url per course, verified against live search
-- results rather than assumed from memory. Run after 0001_courses.sql.
--
-- Density is honest, not padded: domains with abundant free, well-known
-- MOOC coverage (Marketing, Business & Management, Finance & Accounting,
-- Basic Sciences) get 7 courses each; domains where genuinely real, stable,
-- free options are scarcer (Design, Bio Sciences, Law, Mechanical
-- Engineering, Electrical Engineering, and especially Civil Engineering)
-- get fewer rather than being filled out with invented or unverified ones.

insert into courses (title, description, domain, level, duration_hours, skills_taught, prerequisite_skills, source_url) values

-- Marketing
('Google Digital Marketing & E-commerce Professional Certificate', 'Google''s entry-level path through digital marketing channels and e-commerce operations, aimed at a first job in the field.', 'Marketing', 'beginner', 90, ARRAY['marketing-fundamentals','digital-marketing'], ARRAY[]::text[], 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce'),
('HubSpot Academy: Content Marketing Certification', 'Planning, creating, and distributing content that attracts an audience, from HubSpot''s own marketing team.', 'Marketing', 'beginner', 8, ARRAY['content-marketing'], ARRAY[]::text[], 'https://academy.hubspot.com/courses/content-marketing'),
('HubSpot Academy: Social Media Marketing Certification', 'Building and measuring a social media strategy across platforms.', 'Marketing', 'beginner', 6, ARRAY['social-media-marketing'], ARRAY[]::text[], 'https://academy.hubspot.com/courses/social-media'),
('Google Analytics Academy: Google Analytics for Beginners', 'Reading traffic and conversion data well enough to tell whether a campaign actually worked.', 'Marketing', 'beginner', 8, ARRAY['marketing-analytics'], ARRAY[]::text[], 'https://analytics.google.com/analytics/academy/'),
('HubSpot Academy: SEO Course', 'Getting a page found by search engines on purpose — keywords, technical SEO, and link building.', 'Marketing', 'intermediate', 10, ARRAY['seo'], ARRAY['marketing-fundamentals'], 'https://academy.hubspot.com/courses/seo'),
('HubSpot Academy: Email Marketing Certification', 'Building lifecycle email campaigns that convert without reading as spam.', 'Marketing', 'intermediate', 6, ARRAY['email-marketing'], ARRAY['marketing-fundamentals'], 'https://academy.hubspot.com/courses/email-marketing-certification-en'),
('Digital Marketing Specialization', 'University of Illinois'' strategy-level look at digital marketing analytics, channel planning, and marketing management.', 'Marketing', 'intermediate', 60, ARRAY['marketing-strategy'], ARRAY['marketing-fundamentals'], 'https://www.coursera.org/specializations/digital-marketing'),

-- Business & Management
('Wharton Business Foundations Specialization', 'Wharton''s four-course primer on marketing, finance, operations, and accounting — a first look at how a business runs.', 'Business & Management', 'beginner', 80, ARRAY['business-fundamentals'], ARRAY[]::text[], 'https://www.coursera.org/specializations/wharton-business-foundations'),
('Fundamentals of Project Planning and Management', 'University of Virginia Darden''s primer on scoping, scheduling, and running a real project from kickoff to close.', 'Business & Management', 'beginner', 12, ARRAY['project-management'], ARRAY[]::text[], 'https://www.coursera.org/learn/uva-darden-projects101'),
('Google Data Analytics Professional Certificate', 'A practitioner path through the data-analysis process aimed at business decision-making.', 'Business & Management', 'beginner', 90, ARRAY['business-analytics'], ARRAY[]::text[], 'https://www.coursera.org/professional-certificates/google-data-analytics'),
('Wharton Entrepreneurship Specialization', 'Building a venture from an idea — opportunity evaluation, launch strategy, and growth, taught by Wharton faculty.', 'Business & Management', 'intermediate', 50, ARRAY['entrepreneurship'], ARRAY['business-fundamentals'], 'https://www.coursera.org/specializations/wharton-entrepreneurship'),
('Khan Academy: Microeconomics', 'Supply, demand, and market structure — the reasoning underneath most business decisions.', 'Business & Management', 'beginner', 20, ARRAY['microeconomics'], ARRAY[]::text[], 'https://www.khanacademy.org/economics-finance-domain/microeconomics'),
('Successful Negotiation: Essential Strategies and Skills', 'University of Michigan''s practical negotiation tactics for deals, salary, and everyday workplace disagreements.', 'Business & Management', 'intermediate', 15, ARRAY['negotiation'], ARRAY['business-fundamentals'], 'https://www.coursera.org/learn/negotiation-skills'),
('Leading People and Teams Specialization', 'University of Michigan''s specialization on motivating a team, managing performance conversations, and leading change.', 'Business & Management', 'advanced', 45, ARRAY['people-management'], ARRAY['project-management'], 'https://www.coursera.org/specializations/leading-teams'),

-- Finance & Accounting
('Khan Academy: Personal Finance', 'Budgeting, credit, taxes, and retirement accounts — the financial literacy course most schools skip.', 'Finance & Accounting', 'beginner', 15, ARRAY['personal-finance'], ARRAY[]::text[], 'https://www.khanacademy.org/college-careers-more/personal-finance'),
('Khan Academy: Macroeconomics', 'GDP, inflation, and monetary policy — the economy-wide forces that shape every financial decision.', 'Finance & Accounting', 'beginner', 20, ARRAY['macroeconomics'], ARRAY[]::text[], 'https://www.khanacademy.org/economics-finance-domain/macroeconomics'),
('Introduction to Corporate Finance', 'Wharton''s look at how companies decide what to invest in and how to pay for it.', 'Finance & Accounting', 'intermediate', 15, ARRAY['corporate-finance'], ARRAY['personal-finance'], 'https://www.coursera.org/learn/wharton-finance'),
('Financial Markets', 'Yale''s Robert Shiller on how banks, insurance, and securities markets actually function — and occasionally fail.', 'Finance & Accounting', 'intermediate', 30, ARRAY['financial-markets'], ARRAY['macroeconomics'], 'https://www.coursera.org/learn/financial-markets-global'),
('Intuit Academy Bookkeeping Professional Certificate', 'Double-entry bookkeeping and the accounting cycle, taught by the makers of QuickBooks.', 'Finance & Accounting', 'beginner', 25, ARRAY['bookkeeping','accounting-basics'], ARRAY[]::text[], 'https://www.coursera.org/professional-certificates/intuit-bookkeeping'),
('Khan Academy: Finance and Capital Markets', 'Reading a balance sheet and income statement well enough to know if a company is actually healthy.', 'Finance & Accounting', 'intermediate', 12, ARRAY['financial-statements'], ARRAY['accounting-basics'], 'https://www.khanacademy.org/economics-finance-domain/core-finance'),
('Investment Management Specialization', 'University of Geneva''s specialization on portfolio theory, valuation, and asset allocation for managing investment risk.', 'Finance & Accounting', 'advanced', 45, ARRAY['investment-management'], ARRAY['financial-markets'], 'https://www.coursera.org/specializations/investment-management'),

-- Design (visual/graphic design — distinct from the product-focused UX & Product Design domain)
('Graphic Design Specialization', 'CalArts'' well-known specialization on typography, image-making, and design principles.', 'Design', 'beginner', 60, ARRAY['graphic-design-fundamentals'], ARRAY[]::text[], 'https://www.coursera.org/specializations/graphic-design'),
('Adobe Illustrator Essential Training', 'Vector illustration fundamentals, taught through Adobe''s own official tutorials.', 'Design', 'beginner', 10, ARRAY['illustration','adobe-illustrator'], ARRAY[]::text[], 'https://helpx.adobe.com/illustrator/tutorials.html'),
('Adobe Photoshop Essential Training', 'Photo editing and raster-graphics fundamentals, taught through Adobe''s own official tutorials.', 'Design', 'beginner', 10, ARRAY['photoshop','raster-graphics'], ARRAY[]::text[], 'https://helpx.adobe.com/photoshop/tutorials.html'),
('Canva Design School: Graphic Design Basics', 'Composition, color, and layout fundamentals using Canva''s own free, browser-based design tool.', 'Design', 'beginner', 4, ARRAY['visual-design-basics'], ARRAY[]::text[], 'https://www.canva.com/design-school/courses/'),
('Ideas from the History of Graphic Design', 'CalArts'' look at how graphic design''s visual language evolved, from print revolutions to today''s digital-first design.', 'Design', 'intermediate', 15, ARRAY['design-history'], ARRAY['graphic-design-fundamentals'], 'https://www.coursera.org/learn/graphic-design-history'),

-- Basic Sciences
('Khan Academy: Physics', 'Kinematics, forces, and energy — the core of introductory physics, worked through from first principles.', 'Basic Sciences', 'beginner', 40, ARRAY['physics-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/science/physics'),
('Khan Academy: Chemistry', 'Atoms, bonding, and reactions — the foundational chemistry every later science course assumes.', 'Basic Sciences', 'beginner', 35, ARRAY['chemistry-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/science/chemistry'),
('Khan Academy: Cosmology and Astronomy', 'Stars, black holes, and galaxies — how they form and where they end up.', 'Basic Sciences', 'beginner', 20, ARRAY['astronomy-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/science/cosmology-and-astronomy'),
('Khan Academy: Statistics and Probability', 'The statistical reasoning underneath every experimental science, from distributions to hypothesis testing.', 'Basic Sciences', 'beginner', 30, ARRAY['statistics'], ARRAY[]::text[], 'https://www.khanacademy.org/math/statistics-probability'),
('8.01SC Classical Mechanics', 'MIT''s OCW Scholar introductory physics course — a rigorous second pass at mechanics with full problem sets.', 'Basic Sciences', 'intermediate', 50, ARRAY['classical-mechanics'], ARRAY['physics-fundamentals'], 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/'),
('3.091SC Introduction to Solid State Chemistry', 'MIT''s OCW Scholar course connecting chemistry to the material properties of real solids.', 'Basic Sciences', 'intermediate', 45, ARRAY['materials-chemistry'], ARRAY['chemistry-fundamentals'], 'https://ocw.mit.edu/courses/3-091sc-introduction-to-solid-state-chemistry-fall-2010/'),
('8.02 Physics II: Electricity and Magnetism', 'MIT''s introductory course on electric and magnetic fields, circuits, and electromagnetic waves.', 'Basic Sciences', 'advanced', 50, ARRAY['electromagnetism'], ARRAY['classical-mechanics'], 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2019/'),

-- Bio Sciences
('Khan Academy: Biology', 'Cells, genetics, and evolution — the foundational biology every advanced life-science course assumes.', 'Bio Sciences', 'beginner', 35, ARRAY['biology-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/science/biology'),
('7.01SC Fundamentals of Biology', 'MIT''s OCW Scholar molecular and cell biology course — a rigorous second pass at how a cell actually works.', 'Bio Sciences', 'intermediate', 50, ARRAY['molecular-biology'], ARRAY['biology-fundamentals'], 'https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/'),
('Khan Academy: AP Biology', 'Exam-aligned deep dives into genetics, evolution, and cellular processes, building on general biology.', 'Bio Sciences', 'intermediate', 25, ARRAY['biology-fundamentals-advanced'], ARRAY['biology-fundamentals'], 'https://www.khanacademy.org/science/ap-biology'),
('Khan Academy: Health and Medicine', 'Organ systems and physiology — how the human body actually works, system by system.', 'Bio Sciences', 'beginner', 25, ARRAY['human-biology'], ARRAY['biology-fundamentals'], 'https://www.khanacademy.org/science/health-and-medicine'),
('Epidemiology: The Basic Science of Public Health', 'University of North Carolina''s look at how disease spreads through a population and the statistics used to study it.', 'Bio Sciences', 'intermediate', 15, ARRAY['epidemiology'], ARRAY['biology-fundamentals'], 'https://www.coursera.org/learn/epidemiology'),
('Bioinformatics Specialization', 'UC San Diego''s six-course path into the computational side of modern biology, culminating in a genome-sequencing capstone.', 'Bio Sciences', 'advanced', 90, ARRAY['bioinformatics'], ARRAY['molecular-biology'], 'https://www.coursera.org/specializations/bioinformatics/'),

-- Law
('An Introduction to American Law', 'University of Pennsylvania''s survey of tort, contract, property, constitutional, and criminal law.', 'Law', 'beginner', 20, ARRAY['legal-fundamentals'], ARRAY[]::text[], 'https://www.coursera.org/learn/american-law'),
('A Law Student''s Toolkit', 'Yale''s introduction to the core legal, historical, and philosophical concepts a first-year law student needs.', 'Law', 'beginner', 15, ARRAY['legal-reasoning'], ARRAY[]::text[], 'https://www.coursera.org/learn/law-student'),
('Khan Academy: US Government and Civics', 'How law is actually made and enforced — the civics foundation most legal reasoning assumes.', 'Law', 'beginner', 15, ARRAY['civics-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/humanities/us-government-and-civics'),
('Contract Law: From Trust to Promise to Contract', 'Harvard Law''s Charles Fried on the doctrines and reasoning underneath every enforceable agreement.', 'Law', 'intermediate', 30, ARRAY['contract-law'], ARRAY['legal-fundamentals'], 'https://pll.harvard.edu/course/contractsx-trust-promise-contract'),
('Human Rights for Open Societies', 'Utrecht University''s introduction to the European Convention on Human Rights and how it''s actually applied.', 'Law', 'intermediate', 15, ARRAY['human-rights-law'], ARRAY['legal-fundamentals'], 'https://www.coursera.org/learn/humanrights'),

-- Mechanical Engineering
('Introduction to Mechanical Engineering Design and Manufacturing with Fusion 360', 'Autodesk''s hands-on path through CAD modeling and manufacturing basics using Fusion 360.', 'Mechanical Engineering', 'beginner', 20, ARRAY['cad-fundamentals'], ARRAY[]::text[], 'https://www.coursera.org/learn/mechanical-engineering-design-manufacturing/'),
('2.003SC Engineering Dynamics', 'MIT''s OCW Scholar course on the motion of particles and rigid bodies under real forces.', 'Mechanical Engineering', 'intermediate', 50, ARRAY['engineering-dynamics'], ARRAY['classical-mechanics'], 'https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/'),
('2.007 Design and Manufacturing I', 'MIT''s iconic course where students design and build a robot for an annual competition.', 'Mechanical Engineering', 'advanced', 60, ARRAY['mechanical-design'], ARRAY['engineering-dynamics'], 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/'),
('Robotics Specialization', 'University of Pennsylvania''s specialization on how robots move, sense, and plan in the real world.', 'Mechanical Engineering', 'advanced', 90, ARRAY['robotics'], ARRAY['engineering-dynamics'], 'https://www.coursera.org/specializations/robotics'),

-- Civil Engineering
('1.050 Engineering Mechanics I', 'MIT''s introduction to the mechanics of materials and structures — how a beam or a bridge actually carries load.', 'Civil Engineering', 'intermediate', 45, ARRAY['structural-mechanics'], ARRAY['classical-mechanics'], 'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/'),
('Construction Management Specialization', 'Columbia University''s specialization on project initiation, scheduling, cost estimating, and control for real construction projects.', 'Civil Engineering', 'beginner', 50, ARRAY['construction-management'], ARRAY[]::text[], 'https://www.coursera.org/specializations/construction-management'),

-- Electrical Engineering
('Khan Academy: Electrical Engineering', 'Current, voltage, and the math/science groundwork electrical engineering builds on.', 'Electrical Engineering', 'beginner', 25, ARRAY['ee-fundamentals'], ARRAY[]::text[], 'https://www.khanacademy.org/science/electrical-engineering'),
('6.002 Circuits and Electronics', 'MIT''s foundational course on the lumped circuit abstraction — resistors, transistors, and amplifiers from first principles.', 'Electrical Engineering', 'intermediate', 60, ARRAY['circuits'], ARRAY['ee-fundamentals'], 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/'),
('Introduction to Electronics', 'Georgia Tech''s course on diodes, transistors, and op-amps — how basic electronic components actually work.', 'Electrical Engineering', 'intermediate', 20, ARRAY['electronics'], ARRAY['circuits'], 'https://www.coursera.org/learn/electronics'),
('Introduction to Power Electronics', 'University of Colorado Boulder''s course on converting and controlling electrical power at scale.', 'Electrical Engineering', 'advanced', 25, ARRAY['power-electronics'], ARRAY['electronics'], 'https://www.coursera.org/learn/power-electronics');
