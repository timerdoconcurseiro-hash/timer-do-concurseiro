-- Migration: Adicionar controle de limites de I.A. para proteger custos

-- 1. Adicionar colunas de contagem na tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_edital_count INT DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_flashcard_count INT DEFAULT 0;

-- Nota: Como o plano vitalício/anual já inclui acesso, 
-- usaremos essas colunas para registrar quantas vezes o usuário "acionou" o robô da IA.
