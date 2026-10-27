/**
 * Fonte única de verdade para regras de plano/acesso VIP.
 * Use SEMPRE estas funções em vez de comparar `profile.plan` ou `profile.is_vip` diretamente.
 */

export type Plan = "free" | "premium" | "admin";

/** Planos vendidos (códigos usados no checkout e no externalReference do Asaas). */
export type PlanCode = "sprint" | "combo" | "anual";

export interface PlanDefinition {
  code: PlanCode;
  label: string;
  value: number;
  originalValue: number;
  durationDays: number;
  durationLabel: string;
  limitLabel: string;
  maxContests: number;
  subtext: string;
  badge?: string;
  featured?: boolean;
  features: string[];
}

export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  sprint: {
    code: "sprint",
    label: "Sprint Pós-Edital",
    value: 14.9,
    originalValue: 29.9,
    durationDays: 120,
    durationLabel: "4 meses (120 dias)",
    limitLabel: "1 Concurso/Edital Alvo ativo",
    maxContests: 1,
    subtext: "Equivale a R$ 3,73/mês (R$ 0,12/dia)",
    features: [
      "1 Edital ativo verticalizado com IA",
      "Timer integrado com horas líquidas por tópico",
      "Semáforo D2 (⚪ 🔴 🟡 🟢) de domínio",
      "Métricas de edital vencido e evolução",
    ],
  },
  combo: {
    code: "combo",
    label: "Combo Carreiras",
    value: 24.9,
    originalValue: 49.9,
    durationDays: 180,
    durationLabel: "6 meses (180 dias)",
    limitLabel: "Até 3 Editais Simultâneos",
    maxContests: 3,
    subtext: "Apenas R$ 4,15/mês (menos de R$ 0,14/dia)",
    badge: "🔥 RECOMENDADO / MAIS ESCOLHIDO",
    featured: true,
    features: [
      "Até 3 editais simultâneos ativos",
      "Timer individual por tópico e matéria",
      "Semáforo D2 completo de domínio (⚪ 🔴 🟡 🟢)",
      "Comparador de matérias comuns",
      "Relatórios de evolução e constância",
      "Suporte prioritário VIP",
    ],
  },
  anual: {
    code: "anual",
    label: "Passaporte Anual",
    value: 47.9,
    originalValue: 97.9,
    durationDays: 365,
    durationLabel: "12 meses (365 dias)",
    limitLabel: "Editais Ilimitados",
    maxContests: 999,
    subtext: "R$ 3,99/mês (mais barato que 1 café por mês)",
    features: [
      "Editais ilimitados durante 12 meses",
      "Todas as ferramentas VIP sem travas",
      "Prioridade máxima de importação e processamento IA",
      "Histórico vitalício de métricas e horas líquidas",
    ],
  },
};

export const LAUNCH_COUPON_CODE = "LANCAMENTO";
export const LAUNCH_COUPON_COMBO_PRICE = 9.9;

/**
 * Calcula o preço final de um plano considerando cupom promocional opcional.
 * Regra: Cupom `LANCAMENTO` aplicado no plano `combo` reduz para R$ 9,90 (Lote Fundador).
 */
export function resolvePlanPricing(
  planCode: PlanCode,
  rawCoupon?: unknown,
): {
  value: number;
  originalValue: number;
  discountApplied: boolean;
  couponCode: string | null;
} {
  const plan = PLAN_CATALOG[planCode];
  const normalized =
    typeof rawCoupon === "string" ? rawCoupon.trim().toUpperCase() : "";

  if (planCode === "combo" && normalized === LAUNCH_COUPON_CODE) {
    return {
      value: LAUNCH_COUPON_COMBO_PRICE,
      originalValue: plan.value,
      discountApplied: true,
      couponCode: LAUNCH_COUPON_CODE,
    };
  }

  return {
    value: plan.value,
    originalValue: plan.originalValue,
    discountApplied: false,
    couponCode: null,
  };
}

export function isPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && value in PLAN_CATALOG;
}

/** Tenta identificar o plano pelo valor pago (fallback quando não há externalReference). */
export function planCodeFromValue(value: unknown): PlanCode | null {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  if (Math.abs(v - LAUNCH_COUPON_COMBO_PRICE) < 0.01) return "combo";
  const match = (Object.keys(PLAN_CATALOG) as PlanCode[]).find(
    (code) => Math.abs(PLAN_CATALOG[code].value - v) < 0.01,
  );
  return match ?? null;
}

export type PlanProfile = {
  plan?: string | null;
  plan_expires_at?: string | null;
  is_vip?: boolean | null;
  vip_plan?: string | null;
  vip_expires_at?: string | null;
  max_contests?: number | null;
} | null | undefined;

/** true para admin ou VIP/premium dentro da validade. */
export function isPremium(profile: PlanProfile, nowMs: number = Date.now()): boolean {
  if (!profile) return false;
  if (profile.plan === "admin") return true;

  const hasVipFlag = profile.is_vip === true || profile.plan === "premium";
  if (!hasVipFlag) return false;

  const rawExpires = profile.vip_expires_at ?? profile.plan_expires_at;
  if (!rawExpires) return true;
  const expires = new Date(rawExpires).getTime();
  return Number.isFinite(expires) ? expires > nowMs : true;
}

/**
 * Calcula a nova data de expiração ao conceder um plano.
 * Renovações antecipadas somam a partir da expiração atual (não perdem dias).
 */
export function computeExpiry(
  code: PlanCode,
  currentExpiresAt: string | null | undefined,
  currentPlan?: string | null | undefined,
  nowMs: number = Date.now(),
  overrideDays?: number | null,
): string {
  const days =
    typeof overrideDays === "number" && overrideDays > 0
      ? overrideDays
      : PLAN_CATALOG[code].durationDays;
  const current = currentExpiresAt ? new Date(currentExpiresAt).getTime() : 0;
  const base = Number.isFinite(current) && current > nowMs ? current : nowMs;
  return new Date(base + days * 86_400_000).toISOString();
}
