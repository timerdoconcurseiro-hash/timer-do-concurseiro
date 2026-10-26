-- =====================================================================
-- Migration 05: Pivot Estrutural — Billing Asaas (Pix API + Webhook)
--               & Edital Verticalizado Inteligente (Semáforo + Tempo Líquido)
--
-- INSTRUÇÕES:
--   1. Abra o SQL Editor do seu projeto no Supabase.
--   2. Cole todo este script e clique em "Run".
--   3. Script 100% IDEMPOTENTE (pode ser executado mais de uma vez sem erro)
--      e NÃO destrutivo (nenhuma tabela/coluna legada é apagada — D3).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PARTE A — Assinatura e Webhook Asaas
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at   timestamptz NULL,   -- NULL = vitalício (Carreira) ou free
  ADD COLUMN IF NOT EXISTS asaas_customer_id text        NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_asaas_customer_id_key
  ON public.profiles (asaas_customer_id)
  WHERE asaas_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id            text PRIMARY KEY,                 -- id do evento Asaas (ou "EVENTO:pay_xxx")
  event         text        NOT NULL,
  payment_id    text        NOT NULL,
  customer_id   text        NULL,
  user_id       uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  billing_type  text        NULL,
  value         numeric(12,2) NULL,
  status        text        NULL,
  raw           jsonb       NULL,
  error         text        NULL,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz NULL
);

CREATE INDEX IF NOT EXISTS payment_events_payment_id_idx ON public.payment_events (payment_id);
CREATE INDEX IF NOT EXISTS payment_events_user_id_idx    ON public.payment_events (user_id);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment events" ON public.payment_events;
CREATE POLICY "Users can view own payment events"
  ON public.payment_events FOR SELECT
  USING (auth.uid() = user_id);

-- Impede autopromoção de plano pelo cliente (anon/authenticated)
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    NEW.plan              := OLD.plan;
    NEW.plan_expires_at   := OLD.plan_expires_at;
    NEW.asaas_customer_id := OLD.asaas_customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_billing ON public.profiles;
CREATE TRIGGER trg_protect_profile_billing
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_columns();

-- ---------------------------------------------------------------------
-- PARTE B — Edital Verticalizado Inteligente (Semáforo + Tempo por Tópico)
-- ---------------------------------------------------------------------

-- Nome do concurso alvo persistido no perfil do usuário
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_name text NOT NULL DEFAULT 'Meu Concurso Alvo';

-- Ordem das matérias
ALTER TABLE public.edital_subjects
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Colunas do Semáforo e Tempo Estudado nos tópicos
ALTER TABLE public.edital_topics
  ADD COLUMN IF NOT EXISTS user_id         uuid        NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status          text        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS studied_seconds integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_studied_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS position        integer     NOT NULL DEFAULT 0;

-- Constraint das 4 cores do Semáforo (⚪ none | 🔴 red | 🟡 yellow | 🟢 green)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edital_topics_status_check'
  ) THEN
    ALTER TABLE public.edital_topics
      ADD CONSTRAINT edital_topics_status_check
      CHECK (status IN ('none', 'red', 'yellow', 'green'));
  END IF;
END $$;

-- Backfill: popula user_id e converte completed=true antigo em status='green'
UPDATE public.edital_topics t
SET user_id = s.user_id
FROM public.edital_subjects s
WHERE t.subject_id = s.id
  AND t.user_id IS NULL;

UPDATE public.edital_topics
SET status = 'green'
WHERE completed = true
  AND status = 'none';

-- Preenche user_id automaticamente em novos tópicos caso o insert não informe
CREATE OR REPLACE FUNCTION public.fill_edital_topic_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT s.user_id INTO NEW.user_id
    FROM public.edital_subjects s
    WHERE s.id = NEW.subject_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_edital_topic_user_id ON public.edital_topics;
CREATE TRIGGER trg_fill_edital_topic_user_id
  BEFORE INSERT ON public.edital_topics
  FOR EACH ROW EXECUTE FUNCTION public.fill_edital_topic_user_id();

-- Sessões de estudo: vínculo direto com o tópico + chave de idempotência offline
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS edital_topic_id   uuid NULL REFERENCES public.edital_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_session_id uuid NULL;

CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_client_session_id_key
  ON public.study_sessions (client_session_id)
  WHERE client_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS study_sessions_user_finished_idx
  ON public.study_sessions (user_id, finished_at DESC);

CREATE INDEX IF NOT EXISTS study_sessions_edital_topic_idx
  ON public.study_sessions (edital_topic_id)
  WHERE edital_topic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS edital_subjects_user_pos_idx
  ON public.edital_subjects (user_id, position, created_at);

CREATE INDEX IF NOT EXISTS edital_topics_subject_pos_idx
  ON public.edital_topics (subject_id, position, created_at);

CREATE INDEX IF NOT EXISTS edital_topics_user_idx
  ON public.edital_topics (user_id);

-- Trigger: ao inserir sessão com edital_topic_id, soma net_seconds no tópico automaticamente
CREATE OR REPLACE FUNCTION public.accumulate_topic_study_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.edital_topic_id IS NOT NULL AND COALESCE(NEW.net_seconds, 0) > 0 THEN
    UPDATE public.edital_topics
    SET studied_seconds = COALESCE(studied_seconds, 0) + NEW.net_seconds,
        last_studied_at = GREATEST(COALESCE(last_studied_at, NEW.finished_at), NEW.finished_at)
    WHERE id = NEW.edital_topic_id
      AND (user_id IS NULL OR user_id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_accumulate_topic_study_time ON public.study_sessions;
CREATE TRIGGER trg_accumulate_topic_study_time
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.accumulate_topic_study_time();

-- RPC Transacional: salva todo o edital gerado pela IA em uma única chamada atômica
CREATE OR REPLACE FUNCTION public.save_generated_edital_rpc(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  subj jsonb;
  top_name text;
  new_subj_id uuid;
  s_idx integer := 0;
  t_idx integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload->'subjects') <> 'array' THEN
    RAISE EXCEPTION 'Payload de edital inválido';
  END IF;

  FOR subj IN SELECT * FROM jsonb_array_elements(payload->'subjects')
  LOOP
    s_idx := s_idx + 1;
    INSERT INTO public.edital_subjects (user_id, name, target_hours, position)
    VALUES (
      uid,
      left(trim(coalesce(subj->>'name', 'Matéria')), 150),
      least(greatest(coalesce((subj->>'target_hours')::int, 0), 0), 2000),
      s_idx
    )
    RETURNING id INTO new_subj_id;

    IF jsonb_typeof(subj->'topics') = 'array' THEN
      t_idx := 0;
      FOR top_name IN SELECT jsonb_array_elements_text(subj->'topics')
      LOOP
        IF length(trim(coalesce(top_name, ''))) > 0 THEN
          t_idx := t_idx + 1;
          INSERT INTO public.edital_topics (subject_id, user_id, name, status, completed, position)
          VALUES (
            new_subj_id,
            uid,
            left(trim(top_name), 300),
            'none',
            false,
            t_idx
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
