-- Rode este script no Editor SQL do seu Supabase para o Módulo 2 (Ciclo Inteligente / Revisões Espaçadas)

CREATE TABLE public.spaced_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  topic text,
  review_date date NOT NULL, -- Data programada para a revisão
  status text NOT NULL DEFAULT 'pending', -- 'pending' ou 'completed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.spaced_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view own reviews" 
ON public.spaced_reviews FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews" 
ON public.spaced_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
ON public.spaced_reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
ON public.spaced_reviews FOR DELETE 
USING (auth.uid() = user_id);
