-- =============================================================================
-- MIGRATION 06: PRICING TIERS (SPRINT / COMBO / ANUAL) & VIP METADATA
-- Timer do Concurseiro — Modelo de pagamento único via Pix por ciclos
-- =============================================================================
-- Esta migration é 100% IDEMPOTENTE (pode ser rodada múltiplas vezes com segurança).
-- Adiciona colunas explícitas de controle VIP em `public.profiles`:
--   - is_vip (boolean)
--   - vip_plan (text: 'sprint' | 'combo' | 'anual')
--   - max_contests (integer: 1 | 3 | 999)
--   - vip_expires_at (timestamptz)
-- E atualiza a trigger `protect_profile_billing_columns()` para impedir adulteração
-- client-side dessas novas colunas.
-- =============================================================================

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vip_plan text,
  ADD COLUMN IF NOT EXISTS max_contests integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_is_vip_idx
  ON public.profiles (is_vip);

-- Sincroniza perfis que já eram 'premium' antes da migration 06
UPDATE public.profiles
SET
  is_vip = true,
  vip_plan = COALESCE(vip_plan, 'anual'),
  max_contests = CASE WHEN max_contests = 0 THEN 999 ELSE max_contests END,
  vip_expires_at = COALESCE(vip_expires_at, plan_expires_at)
WHERE plan = 'premium' AND is_vip = false;

-- Atualiza a função de proteção para blindar também is_vip, vip_plan, max_contests e vip_expires_at
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE( current_setting('request.jwt.claim.role', true), '' ) <> 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    NEW.plan := OLD.plan;
    NEW.plan_expires_at := OLD.plan_expires_at;
    NEW.asaas_customer_id := OLD.asaas_customer_id;
    NEW.trial_end := OLD.trial_end;
    NEW.is_vip := OLD.is_vip;
    NEW.vip_plan := OLD.vip_plan;
    NEW.max_contests := OLD.max_contests;
    NEW.vip_expires_at := OLD.vip_expires_at;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
