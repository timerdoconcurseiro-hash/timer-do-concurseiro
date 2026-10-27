import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  AsaasError,
  createCustomer,
  createPixPayment,
  findCustomersByEmail,
  getPixQrCode,
  isAsaasConfigured,
  updateCustomer,
} from "@/lib/asaas/client";
import {
  buildExternalReference,
  isMissingColumn,
  isMissingRelation,
} from "@/lib/asaas/webhook";
import { isPlanCode, PLAN_CATALOG, resolvePlanPricing } from "@/lib/plans";

export const dynamic = "force-dynamic";

function isValidCpfCnpj(raw: string): boolean {
  const digits = (raw || "").replace(/\D+/g, "");
  if (digits.length === 11) {
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    if (rev !== Number(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    return rev === Number(digits[10]);
  }
  if (digits.length === 14) {
    return !/^(\d)\1{13}$/.test(digits);
  }
  return false;
}

function todayDateString(): string {
  return new Date(Date.now() + 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

export async function POST(request: Request) {
  try {
    // Bloqueio de segurança em modo pré-lançamento
    const salesOpen =
      process.env.NEXT_PUBLIC_SALES_OPEN === "true" &&
      process.env.SALES_PRELAUNCH_LOCK === "false";
    if (!salesOpen) {
      return NextResponse.json(
        {
          error:
            "🚀 Liberação em Breve! As vendas oficiais do Lote VIP serão abertas nos próximos dias. Prepare-se!",
        },
        { status: 403 },
      );
    }

    if (!isAsaasConfigured()) {
      return NextResponse.json(
        {
          error:
            "O gateway de pagamentos Asaas ainda não está configurado no servidor (ASAAS_API_KEY / ASAAS_API_URL).",
        },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user || !authData.user.email) {
      return NextResponse.json(
        { error: "Faça login com sua conta Google antes de gerar o Pix." },
        { status: 401 },
      );
    }

    let body: {
      plan?: unknown;
      cpfCnpj?: unknown;
      name?: unknown;
      coupon?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    if (!isPlanCode(body.plan)) {
      return NextResponse.json(
        { error: "Plano inválido. Escolha entre sprint, combo ou anual." },
        { status: 400 },
      );
    }

    const cleanCpf = String(body.cpfCnpj || "").replace(/\D+/g, "");
    if (!isValidCpfCnpj(cleanCpf)) {
      return NextResponse.json(
        { error: "Informe um CPF (11 dígitos) ou CNPJ válido para emissão da cobrança Pix." },
        { status: 400 },
      );
    }

    const plan = PLAN_CATALOG[body.plan];
    const pricing = resolvePlanPricing(body.plan, body.coupon);
    const user = authData.user;
    const userEmail = user.email!;
    const customerName =
      String(body.name || user.user_metadata?.full_name || userEmail.split("@")[0])
        .trim()
        .slice(0, 100) || "Concurseiro";

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    let customerId: string | null =
      (profile as { asaas_customer_id?: string | null } | null)?.asaas_customer_id ?? null;

    if (!customerId) {
      const existing = await findCustomersByEmail(userEmail);
      if (existing.data && existing.data.length > 0) {
        customerId = existing.data[0].id;
        await updateCustomer(customerId, {
          name: customerName,
          cpfCnpj: cleanCpf,
          externalReference: user.id,
        });
      } else {
        const created = await createCustomer({
          name: customerName,
          email: userEmail,
          cpfCnpj: cleanCpf,
          externalReference: user.id,
        });
        customerId = created.id;
      }

      // Persiste o asaas_customer_id no perfil (ignora se a coluna ainda não existir)
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ asaas_customer_id: customerId })
        .eq("id", user.id);
      if (updateErr && !isMissingColumn(updateErr.code)) {
        console.warn("[Checkout Pix] Não foi possível salvar asaas_customer_id:", updateErr.message);
      }
    } else {
      await updateCustomer(customerId, {
        cpfCnpj: cleanCpf,
        externalReference: user.id,
      }).catch(() => {});
    }

    const externalReference = buildExternalReference(user.id, body.plan);
    const descriptionSuffix = pricing.discountApplied
      ? ` (Cupom ${pricing.couponCode} - Lote Fundador)`
      : ` (${plan.durationDays} dias)`;

    const payment = await createPixPayment({
      customer: customerId,
      value: pricing.value,
      dueDate: todayDateString(),
      description: `Timer do Concurseiro VIP - ${plan.label}${descriptionSuffix}`,
      externalReference,
    });

    // Salva no ledger payment_events os metadados da cobrança (userId, plan, daysDuration, maxContests)
    const { error: ledgerErr } = await supabaseAdmin.from("payment_events").upsert(
      {
        id: `PIX_CREATED:${payment.id}`,
        event: "PIX_CHARGE_CREATED",
        payment_id: payment.id,
        customer_id: customerId,
        user_id: user.id,
        billing_type: "PIX",
        value: pricing.value,
        status: payment.status ?? "PENDING",
        processed_at: new Date().toISOString(),
        raw: {
          userId: user.id,
          plan: body.plan,
          daysDuration: plan.durationDays,
          maxContests: plan.maxContests,
          couponCode: pricing.couponCode,
          discountApplied: pricing.discountApplied,
          externalReference,
        },
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (ledgerErr && !isMissingRelation(ledgerErr.code)) {
      console.warn("[Checkout Pix] Aviso ao registrar metadata em payment_events:", ledgerErr.message);
    }

    const qr = await getPixQrCode(payment.id);

    return NextResponse.json({
      paymentId: payment.id,
      plan: body.plan,
      planLabel: plan.label,
      value: pricing.value,
      originalValue: pricing.originalValue,
      discountApplied: pricing.discountApplied,
      couponCode: pricing.couponCode,
      daysDuration: plan.durationDays,
      maxContests: plan.maxContests,
      encodedImage: qr.encodedImage,
      payload: qr.payload,
      expirationDate: qr.expirationDate ?? null,
    });
  } catch (err: unknown) {
    console.error("[POST /api/checkout/pix]", err);
    if (err instanceof AsaasError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    return NextResponse.json(
      { error: "Erro inesperado ao gerar cobrança Pix. Tente novamente." },
      { status: 500 },
    );
  }
}
