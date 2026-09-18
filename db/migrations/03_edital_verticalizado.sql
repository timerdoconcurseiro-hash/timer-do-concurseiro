-- Migration: Edital Verticalizado
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS edital_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_hours INTEGER DEFAULT 0,
    studied_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS edital_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES edital_subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Políticas de RLS
ALTER TABLE edital_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE edital_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own edital subjects"
ON edital_subjects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own edital topics"
ON edital_topics FOR ALL
USING (EXISTS (SELECT 1 FROM edital_subjects WHERE id = edital_topics.subject_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM edital_subjects WHERE id = edital_topics.subject_id AND user_id = auth.uid()));
