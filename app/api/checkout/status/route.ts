import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPayment, isAsaasConfigured } from "@/lib/asaas/client";
import { isMissingColumn, parseExternalReference } from "@/lib/asaas/webhook";
import {
  computeExpiry,
  isPremium,
  PLAN_CATALOG,
  planCodeFromValue,
  type PlanCode,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId");

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (isPremium(profile)) {
      return NextResponse.json({ paid: true, status: "CONFIRMED" });
    }

    if (!paymentId || !isAsaasConfigured()) {
      return NextResponse.json({ paid: false, status: "PENDING" });
    }

    const payment = await getPayment(paymentId);
    const ref = parseExternalReference(payment.externalReference);

    // Segurança: garante que a cobrança pertence ao usuário logado
    if (ref.userId && ref.userId !== authData.user.id) {
      return NextResponse.json({ error: "Cobrança não pertence a este usuário." }, { status: 403 });
    }

    if (
      payment.status === "RECEIVED" ||
      payment.status === "CONFIRMED" ||
      payment.status === "RECEIVED_IN_CASH"
    ) {
      // Liberação proativa caso o webhook ainda esteja na fila
      const planCode: PlanCode = ref.plan ?? planCodeFromValue(payment.value) ?? "sprint";
      const daysDuration = ref.daysDuration ?? PLAN_CATALOG[planCode].durationDays;
      const maxContests = ref.maxContests ?? PLAN_CATALOG[planCode].maxContests;
      const currentExpires =
        (profile as { vip_expires_at?: string | null; plan_expires_at?: string | null } | null)
          ?.vip_expires_at ??
        (profile as { plan_expires_at?: string | null } | null)?.plan_expires_at;

      const expiresAt = computeExpiry(
        planCode,
        currentExpires,
        profile?.plan,
        Date.now(),
        daysDuration,
      );

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "premium",
          plan_expires_at: expiresAt,
          is_vip: true,
          vip_plan: planCode,
          max_contests: maxContests,
          vip_expires_at: expiresAt,
        })
        .eq("id", authData.user.id);

      if (error && isMissingColumn(error.code)) {
        const { error: err05 } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "premium", plan_expires_at: expiresAt })
          .eq("id", authData.user.id);
        if (err05 && isMissingColumn(err05.code)) {
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "premium" })
            .eq("id", authData.user.id);
        }
      }

      return NextResponse.json({ paid: true, status: payment.status });
    }

    return NextResponse.json({ paid: false, status: payment.status });
  } catch (err) {
    console.error("[GET /api/checkout/status]", err);
    return NextResponse.json({ paid: false, status: "PENDING" });
  }
}
