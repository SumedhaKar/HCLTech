-- Seed addition: 8 real courses filling a genuine gap in Data Science &
-- Machine Learning — the existing 7 courses in that domain were all
-- classical ML/DS (pandas, scikit-learn-style ML, deep learning theory, NLP
-- theory), with nothing on building applications on top of LLMs, which is
-- what "AI Engineer" actually means in current industry usage. All titles,
-- descriptions, and source_urls verified against the real course pages
-- before being added, not fabricated. Run after 0001_courses.sql and
-- 0002_courses_expansion.sql have been applied.
-- skills_taught / prerequisite_skills are skill tags, not course IDs — the
-- recommendation engine chains courses by matching one course's
-- skills_taught against another's prerequisite_skills (see docs/adr/0003).

insert into courses (title, description, domain, level, duration_hours, skills_taught, prerequisite_skills, source_url) values

('ChatGPT Prompt Engineering for Developers', 'OpenAI and DeepLearning.AI''s short course on the two core principles for writing effective prompts, and how to use them systematically rather than by trial and error.', 'Data Science & Machine Learning', 'beginner', 2, ARRAY['prompt-engineering'], ARRAY['python-basics'], 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/'),
('Building Systems with the ChatGPT API', 'Chaining LLM calls into an actual multi-step system — built around a working customer-service chatbot, not just single prompts.', 'Data Science & Machine Learning', 'beginner', 2, ARRAY['llm-app-building'], ARRAY['prompt-engineering'], 'https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/'),
('LangChain for LLM Application Development', 'Models, prompts, memory, chains, and agents — the framework most production LLM applications are actually built on, taught by its creator.', 'Data Science & Machine Learning', 'intermediate', 1, ARRAY['langchain'], ARRAY['prompt-engineering'], 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/'),
('Vector Databases: from Embeddings to Applications', 'How embeddings capture meaning and how a vector database finds the closest ones fast — the retrieval half of RAG, taught with Weaviate.', 'Data Science & Machine Learning', 'intermediate', 2, ARRAY['vector-databases'], ARRAY['python-basics'], 'https://www.deeplearning.ai/courses/vector-databases-embeddings-applications'),
('Building and Evaluating Advanced RAG Applications', 'Sentence-window and auto-merging retrieval, plus the RAG Triad — a real way to measure whether a retrieval pipeline is actually grounded.', 'Data Science & Machine Learning', 'advanced', 2, ARRAY['rag'], ARRAY['langchain', 'vector-databases'], 'https://www.deeplearning.ai/courses/building-evaluating-advanced-rag'),
('AI Agents in LangGraph', 'Building a controllable, multi-step agent from scratch, then rebuilding it properly with LangGraph''s flow-based components.', 'Data Science & Machine Learning', 'advanced', 2, ARRAY['ai-agents'], ARRAY['langchain'], 'https://www.deeplearning.ai/courses/ai-agents-in-langgraph'),
('Machine Learning Engineering for Production (MLOps) Specialization', 'Taking a model past the notebook — scoping, data pipelines, deployment patterns, and monitoring for drift once it is actually live.', 'Data Science & Machine Learning', 'advanced', 40, ARRAY['mlops'], ARRAY['deep-learning'], 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops'),
('Hugging Face LLM Course', 'A free, thorough tour of the Transformers ecosystem — tokenizers, fine-tuning, and the architecture internals underneath every LLM API call.', 'Data Science & Machine Learning', 'advanced', 50, ARRAY['transformers', 'llm-internals'], ARRAY['deep-learning'], 'https://huggingface.co/learn/llm-course/chapter1/1');
