-- Rode este script no Editor SQL do seu Supabase para o Módulo 1 (Projeção de Edital)

CREATE TABLE public.exam_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exam_date date NOT NULL,
  target_hours integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id) -- Apenas um edital ativo por usuário no momento
);

-- Habilitar RLS
ALTER TABLE public.exam_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view own exam goals" 
ON public.exam_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam goals" 
ON public.exam_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam goals" 
ON public.exam_goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exam goals" 
ON public.exam_goals FOR DELETE 
USING (auth.uid() = user_id);
