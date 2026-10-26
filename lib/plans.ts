/**
 * Fonte única de verdade para regras de plano/assinatura.
 * Use SEMPRE estas funções em vez de comparar `profile.plan` diretamente.
 */

export type Plan = "free" | "premium" | "admin";

/** Planos vendidos (códigos usados no checkout e no externalReference do Asaas). */
export type PlanCode = "mensal" | "anual" | "carreira";

export const PLAN_CATALOG: Record<
  PlanCode,
  { label: string; value: number; durationDays: number | null }
> = {
  mensal: { label: "Mensal", value: 29.9, durationDays: 30 },
  anual: { label: "Anual", value: 147, durationDays: 365 },
  // null = acesso vitalício (Plano Carreira)
  carreira: { label: "Plano Carreira", value: 497, durationDays: null },
};

export function isPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && value in PLAN_CATALOG;
}

/** Tenta identificar o plano pelo valor pago (fallback quando não há externalReference). */
export function planCodeFromValue(value: unknown): PlanCode | null {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  const match = (Object.keys(PLAN_CATALOG) as PlanCode[]).find(
    (code) => Math.abs(PLAN_CATALOG[code].value - v) < 0.01,
  );
  return match ?? null;
}

export type PlanProfile = {
  plan?: string | null;
  plan_expires_at?: string | null;
} | null | undefined;

/** true para admin ou premium dentro da validade (plan_expires_at nulo = vitalício). */
export function isPremium(profile: PlanProfile, nowMs: number = Date.now()): boolean {
  if (!profile) return false;
  if (profile.plan === "admin") return true;
  if (profile.plan !== "premium") return false;
  if (!profile.plan_expires_at) return true;
  const expires = new Date(profile.plan_expires_at).getTime();
  return Number.isFinite(expires) ? expires > nowMs : true;
}

/**
 * Calcula a nova data de expiração ao conceder um plano.
 * Renovações antecipadas somam a partir da expiração atual (não perdem dias).
 * Retorna null para vitalício.
 */
export function computeExpiry(
  code: PlanCode,
  currentExpiresAt: string | null | undefined,
  currentPlan: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  const days = PLAN_CATALOG[code].durationDays;
  if (days === null) return null;
  // Já vitalício: mantém vitalício.
  if (currentPlan === "premium" && !currentExpiresAt) return null;
  const current = currentExpiresAt ? new Date(currentExpiresAt).getTime() : 0;
  const base = Number.isFinite(current) && current > nowMs ? current : nowMs;
  return new Date(base + days * 86_400_000).toISOString();
}
