import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AsaasError, getCustomer, isAsaasConfigured } from "@/lib/asaas/client";
import type { AsaasPayment, AsaasWebhookBody } from "@/lib/asaas/types";
import {
  GRANT_EVENTS,
  REVOKE_EVENTS,
  isMissingColumn,
  isMissingRelation,
  isValidWebhookToken,
  parseExternalReference,
} from "@/lib/asaas/webhook";
import { computeExpiry, planCodeFromValue, type PlanCode } from "@/lib/plans";

/**
 * Webhook do Asaas.
 *
 * Política de resposta (importante: o Asaas PAUSA a fila após falhas seguidas):
 *  - 401  → token inválido/ausente (configuração errada; não processa nada).
 *  - 500  → apenas erros TRANSITÓRIOS (banco/Asaas fora) para o Asaas re-tentar.
 *  - 200  → todo o resto, inclusive "usuário não encontrado" (registrado em payment_events.error).
 */

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  plan: string | null;
  plan_expires_at?: string | null;
};

class TransientError extends Error {}

const ok = (body: Record<string, unknown> = {}) =>
  NextResponse.json({ received: true, ...body }, { status: 200 });

export async function GET() {
  return NextResponse.json({ status: "Webhook is alive" }, { status: 200 });
}

export async function POST(request: Request) {
  // 1. Autenticação do Asaas (header configurado no painel → Webhooks → Token de autenticação)
  if (!isValidWebhookToken(request.headers.get("asaas-access-token"))) {
    console.warn("[Asaas Webhook] Requisição rejeitada: token inválido ou ASAAS_WEBHOOK_TOKEN não configurado.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse do corpo (payload vazio/inválido = teste de URL)
  let body: AsaasWebhookBody;
  try {
    body = (await request.json()) as AsaasWebhookBody;
  } catch {
    return ok({ status: "empty payload" });
  }

  const event = body?.event;
  const payment = body?.payment;
  if (!event || !payment?.id) return ok({ status: "ignored: no payment event" });

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("[Asaas Webhook] Supabase admin indisponível:", err);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const eventId = body.id || `${event}:${payment.id}`;

  try {
    // 3. Idempotência / auditoria
    const ledger = await recordEvent(supabase, eventId, event, payment, body);
    if (ledger === "already_processed") return ok({ status: "duplicate" });
    const ledgerEnabled = ledger !== "disabled";

    const isGrant = GRANT_EVENTS.has(event);
    const isRevoke = REVOKE_EVENTS.has(event);
    if (!isGrant && !isRevoke) {
      if (ledgerEnabled) await markProcessed(supabase, eventId, null, null);
      return ok({ status: "ignored", event });
    }

    // 4. Identificar o usuário
    const ref = parseExternalReference(payment.externalReference);
    const profile = await resolveProfile(supabase, payment, ref.userId, body);
    if (!profile) {
      const msg = `Usuário não encontrado (customer=${payment.customer}, ref=${payment.externalReference ?? "-"})`;
      console.error(`[Asaas Webhook] ${msg}`);
      if (ledgerEnabled) await markProcessed(supabase, eventId, null, msg);
      return ok({ status: "user_not_found" });
    }

    // 5. Aplicar efeito
    if (isGrant) {
      if (ledgerEnabled && (await paymentAlreadyGranted(supabase, payment.id, eventId))) {
        await markProcessed(supabase, eventId, profile.id, null);
        return ok({ status: "already_granted" });
      }
      let planCode: PlanCode | null = ref.plan ?? planCodeFromValue(payment.value);
      if (!planCode) {
        console.warn(`[Asaas Webhook] Valor ${payment.value} não corresponde a nenhum plano; aplicando "mensal".`);
        planCode = "mensal";
      }
      await grantPremium(supabase, profile, planCode, payment.customer);
      console.log(`[Asaas Webhook] Premium (${planCode}) liberado para user=${profile.id}`);
    } else {
      await revokePremium(supabase, profile);
      console.log(`[Asaas Webhook] Acesso revogado (${event}) para user=${profile.id}`);
    }

    if (ledgerEnabled) await markProcessed(supabase, eventId, profile.id, null);
    return ok({ success: true });
  } catch (err) {
    const transient =
      err instanceof TransientError || (err instanceof AsaasError && err.retryable);
    console.error(`[Asaas Webhook] Erro processando ${eventId}:`, err);
    if (transient) {
      return NextResponse.json({ error: "Temporary failure, retry" }, { status: 500 });
    }
    try {
      await markProcessed(supabase, eventId, null, err instanceof Error ? err.message : String(err));
    } catch {
      // ledger indisponível — já logado acima
    }
    return ok({ status: "error_logged" });
  }
}

// ---------------------------------------------------------------------------
// Ledger (tabela payment_events — migration 05). Se a tabela ainda não existir,
// o webhook continua funcionando sem idempotência persistida.
// ---------------------------------------------------------------------------

async function recordEvent(
  supabase: SupabaseClient,
  eventId: string,
  event: string,
  payment: AsaasPayment,
  raw: unknown,
): Promise<"new" | "pending" | "already_processed" | "disabled"> {
  const { error: insertError } = await supabase.from("payment_events").upsert(
    {
      id: eventId,
      event,
      payment_id: payment.id,
      customer_id: payment.customer ?? null,
      billing_type: payment.billingType ?? null,
      value: payment.value ?? null,
      status: payment.status ?? null,
      raw,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (insertError) {
    if (isMissingRelation(insertError.code)) {
      console.warn("[Asaas Webhook] Tabela payment_events ausente — rode a migration 05.");
      return "disabled";
    }
    throw new TransientError(`payment_events insert: ${insertError.message}`);
  }

  const { data, error } = await supabase
    .from("payment_events")
    .select("processed_at")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new TransientError(`payment_events select: ${error.message}`);
  return data?.processed_at ? "already_processed" : "pending";
}

async function markProcessed(
  supabase: SupabaseClient,
  eventId: string,
  userId: string | null,
  errorMsg: string | null,
) {
  const { error } = await supabase
    .from("payment_events")
    .update({ processed_at: new Date().toISOString(), user_id: userId, error: errorMsg })
    .eq("id", eventId);
  if (error && !isMissingRelation(error.code)) {
    console.error("[Asaas Webhook] Falha ao marcar evento como processado:", error.message);
  }
}

/** PAYMENT_CONFIRMED e PAYMENT_RECEIVED podem chegar para a MESMA cobrança — conceder só uma vez. */
async function paymentAlreadyGranted(supabase: SupabaseClient, paymentId: string, currentEventId: string) {
  const { data, error } = await supabase
    .from("payment_events")
    .select("id")
    .eq("payment_id", paymentId)
    .in("event", Array.from(GRANT_EVENTS))
    .not("processed_at", "is", null)
    .is("error", null)
    .neq("id", currentEventId)
    .limit(1);
  if (error) throw new TransientError(`payment_events grant check: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Resolução de usuário: externalReference → asaas_customer_id → e-mail do cliente
// ---------------------------------------------------------------------------

async function selectProfile(
  supabase: SupabaseClient,
  column: "id" | "email" | "asaas_customer_id",
  value: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq(column, value)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (column === "asaas_customer_id" && isMissingColumn(error.code)) return null;
    throw new TransientError(`profiles lookup (${column}): ${error.message}`);
  }
  return (data as ProfileRow) ?? null;
}

async function resolveProfile(
  supabase: SupabaseClient,
  payment: AsaasPayment,
  refUserId: string | null,
  body: AsaasWebhookBody,
): Promise<ProfileRow | null> {
  if (refUserId) {
    const byId = await selectProfile(supabase, "id", refUserId);
    if (byId) return byId;
  }

  if (payment.customer) {
    const byCustomer = await selectProfile(supabase, "asaas_customer_id", payment.customer);
    if (byCustomer) return byCustomer;
  }

  // E-mail: o payload padrão NÃO traz e-mail; buscamos o cliente na API.
  const loose = payment as unknown as Record<string, unknown>;
  const looseBody = body as unknown as { customer?: { email?: unknown } };
  let email: unknown = loose.customerEmail || loose.email || looseBody.customer?.email;

  if (!email && payment.customer && isAsaasConfigured()) {
    const customer = await getCustomer(payment.customer); // AsaasError retryable → 500
    email = customer.email;
  }

  if (typeof email !== "string" || !email.includes("@")) return null;
  const trimmed = email.trim();
  return (
    (await selectProfile(supabase, "email", trimmed)) ??
    (trimmed !== trimmed.toLowerCase()
      ? await selectProfile(supabase, "email", trimmed.toLowerCase())
      : null)
  );
}

// ---------------------------------------------------------------------------
// Efeitos no perfil (com fallback caso as colunas da migration 05 ainda não existam)
// ---------------------------------------------------------------------------

async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  full: Record<string, unknown>,
  minimal: Record<string, unknown>,
) {
  if (Object.keys(full).length === 0) return;
  const { error } = await supabase.from("profiles").update(full).eq("id", userId);
  if (!error) return;
  if (isMissingColumn(error.code)) {
    console.warn("[Asaas Webhook] Colunas de assinatura ausentes — rode a migration 05. Aplicando update mínimo.");
    if (Object.keys(minimal).length === 0) return;
    const { error: retryError } = await supabase.from("profiles").update(minimal).eq("id", userId);
    if (!retryError) return;
    throw new TransientError(`profiles update (mínimo): ${retryError.message}`);
  }
  throw new TransientError(`profiles update: ${error.message}`);
}

async function grantPremium(
  supabase: SupabaseClient,
  profile: ProfileRow,
  planCode: PlanCode,
  customerId: string | undefined,
) {
  const isAdmin = profile.plan === "admin";
  const full: Record<string, unknown> = {};
  if (customerId) full.asaas_customer_id = customerId;
  if (!isAdmin) {
    full.plan = "premium";
    full.plan_expires_at = computeExpiry(planCode, profile.plan_expires_at, profile.plan);
  }
  await updateProfile(supabase, profile.id, full, isAdmin ? {} : { plan: "premium" });
}

async function revokePremium(supabase: SupabaseClient, profile: ProfileRow) {
  if (profile.plan === "admin") return; // nunca rebaixa admin automaticamente
  await updateProfile(
    supabase,
    profile.id,
    { plan: "free", plan_expires_at: null },
    { plan: "free" },
  );
}
