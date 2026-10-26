-- =====================================================================
-- Migration 05: Billing Asaas (Pix via API + Webhook blindado)
-- Execute no SQL Editor do Supabase. Script idempotente (pode rodar 2x).
-- =====================================================================

-- 1. Colunas de assinatura no perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at   timestamptz NULL,   -- NULL = vitalício (Carreira) ou free
  ADD COLUMN IF NOT EXISTS asaas_customer_id text        NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_asaas_customer_id_key
  ON public.profiles (asaas_customer_id)
  WHERE asaas_customer_id IS NOT NULL;

-- Busca do webhook por e-mail
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- 2. Ledger de eventos do Asaas (auditoria + idempotência)
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

-- 3. RLS: apenas o Service Role (webhook) acessa. Usuários podem LER os próprios eventos.
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment events" ON public.payment_events;
CREATE POLICY "Users can view own payment events"
  ON public.payment_events FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Impede que o próprio usuário se promova a premium via client (anon key).
--    Colunas sensíveis só podem ser alteradas pelo service_role.
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND current_user NOT IN ('postgres', 'supabase_admin') THEN
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
