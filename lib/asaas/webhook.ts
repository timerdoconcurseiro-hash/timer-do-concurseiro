import { timingSafeEqual } from "node:crypto";
import { isPlanCode, PLAN_CATALOG, type PlanCode } from "@/lib/plans";

/** Eventos que liberam acesso. */
export const GRANT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

/** Eventos que revogam acesso (estorno / contestação). */
export const REVOKE_EVENTS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
]);

/**
 * Compara o header `asaas-access-token` com ASAAS_WEBHOOK_TOKEN (ou alias ASAAS_WEBHOOK_ACCESS_TOKEN)
 * em tempo constante. Falha FECHADO: sem token configurado, nenhuma requisição é aceita.
 */
export function isValidWebhookToken(received: string | null): boolean {
  const expected =
    process.env.ASAAS_WEBHOOK_TOKEN || process.env.ASAAS_WEBHOOK_ACCESS_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * externalReference gerado pelo nosso checkout:
 * "tdc:<userId>:<planCode>:<daysDuration>:<maxContests>".
 * Mantém compatibilidade com formatos anteriores ("tdc:<userId>:<planCode>" ou UUID puro).
 */
export function buildExternalReference(userId: string, plan: PlanCode): string {
  const cfg = PLAN_CATALOG[plan];
  return `tdc:${userId}:${plan}:${cfg.durationDays}:${cfg.maxContests}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedExternalReference {
  userId: string | null;
  plan: PlanCode | null;
  daysDuration: number | null;
  maxContests: number | null;
}

export function parseExternalReference(
  ref: string | null | undefined,
): ParsedExternalReference {
  if (!ref || typeof ref !== "string") {
    return { userId: null, plan: null, daysDuration: null, maxContests: null };
  }
  const parts = ref.split(":");
  if (parts[0] === "tdc" && parts.length >= 2) {
    const userId = UUID_RE.test(parts[1]) ? parts[1] : null;
    const plan = isPlanCode(parts[2]) ? parts[2] : null;
    const rawDays = parts[3] ? Number(parts[3]) : NaN;
    const rawMax = parts[4] ? Number(parts[4]) : NaN;
    const daysDuration =
      Number.isFinite(rawDays) && rawDays > 0
        ? rawDays
        : plan
          ? PLAN_CATALOG[plan].durationDays
          : null;
    const maxContests =
      Number.isFinite(rawMax) && rawMax > 0
        ? rawMax
        : plan
          ? PLAN_CATALOG[plan].maxContests
          : null;
    return { userId, plan, daysDuration, maxContests };
  }
  return {
    userId: UUID_RE.test(ref) ? ref : null,
    plan: null,
    daysDuration: null,
    maxContests: null,
  };
}

/** Códigos PostgREST/Postgres para "objeto ainda não existe" (migration não aplicada). */
export function isMissingRelation(code?: string | null) {
  return code === "42P01" || code === "PGRST205";
}
export function isMissingColumn(code?: string | null) {
  return code === "42703" || code === "PGRST204";
}
