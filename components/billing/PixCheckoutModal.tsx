"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  QrCode,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Tag,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  LAUNCH_COUPON_CODE,
  PLAN_CATALOG,
  resolvePlanPricing,
  type PlanCode,
} from "@/lib/plans";

interface PixCheckoutModalProps {
  planCode: PlanCode | null;
  initialCoupon?: string;
  onClose: () => void;
  onChangePlan?: (plan: PlanCode) => void;
}

interface PixChargeData {
  paymentId: string;
  value: number;
  originalValue?: number;
  discountApplied?: boolean;
  couponCode?: string | null;
  planLabel: string;
  daysDuration?: number;
  maxContests?: number;
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D+/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits;
}

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function PixCheckoutModal({
  planCode,
  initialCoupon = "",
  onClose,
  onChangePlan,
}: PixCheckoutModalProps) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [coupon, setCoupon] = useState(initialCoupon);
  const [showCouponInput, setShowCouponInput] = useState(Boolean(initialCoupon));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<PixChargeData | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  // Polling de confirmação do Pix a cada 3 segundos
  useEffect(() => {
    if (!charge || paid) return;
    let cancelled = false;

    const timer = setInterval(async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(
          `/api/checkout/status?paymentId=${encodeURIComponent(charge.paymentId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { paid?: boolean };
        if (!cancelled && json.paid) {
          setPaid(true);
          setTimeout(() => {
            router.replace("/vip");
          }, 1200);
        }
      } catch {
        // ignora erro de rede temporário
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [charge, paid, router]);

  if (!planCode) return null;
  const plan = PLAN_CATALOG[planCode];
  const pricing = resolvePlanPricing(planCode, coupon);
  const normalizedCoupon = coupon.trim().toUpperCase();
  const isCouponTypedForWrongPlan =
    normalizedCoupon === LAUNCH_COUPON_CODE && planCode !== "combo";

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planCode,
          cpfCnpj: cpf,
          coupon: normalizedCoupon || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Não foi possível gerar o QR Code Pix.");
      }
      setCharge(json as PixChargeData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao comunicar com o gateway Pix.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPayload = async () => {
    if (!charge?.payload) return;
    try {
      await navigator.clipboard.writeText(charge.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 text-slate-200 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Fechar checkout"
        >
          <X size={20} />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <QrCode size={14} /> Pagamento Único via Pix
          </div>
          <h3 className="text-2xl font-bold text-white flex flex-wrap items-baseline gap-2">
            <span>{plan.label}</span>
            <span className="text-amber-400">
              R$ {formatBRL(charge ? charge.value : pricing.value)}
            </span>
            {pricing.discountApplied && (
              <span className="text-xs font-normal text-slate-500 line-through">
                R$ {formatBRL(plan.value)}
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700/70 px-2.5 py-0.5 text-slate-300">
              <Clock size={12} className="text-emerald-400" /> {plan.durationLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700/70 px-2.5 py-0.5 text-slate-300">
              {plan.limitLabel}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {paid ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={56} className="mx-auto text-emerald-400 animate-bounce" />
            <h4 className="text-xl font-bold text-white">Pagamento Confirmado!</h4>
            <p className="text-sm text-slate-400">
              Seu acesso VIP ({plan.label}) foi liberado. Redirecionando...
            </p>
          </div>
        ) : !charge ? (
          <form onSubmit={handleGeneratePix} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cpf-input" className="text-xs font-semibold text-slate-300">
                CPF ou CNPJ do titular (exigido pelo Banco Central para Pix)
              </label>
              <input
                id="cpf-input"
                type="text"
                inputMode="numeric"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Cupom Promocional */}
            <div className="space-y-2">
              {!showCouponInput ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Tag size={13} /> Possui um cupom de desconto?
                </button>
              ) : (
                <div className="space-y-1.5">
                  <label
                    htmlFor="coupon-input"
                    className="text-xs font-semibold text-slate-300 flex items-center justify-between"
                  >
                    <span>Cupom promocional (opcional)</span>
                    {pricing.discountApplied && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles size={12} /> Lote Fundador Ativo!
                      </span>
                    )}
                  </label>
                  <input
                    id="coupon-input"
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Ex: LANCAMENTO"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              {pricing.discountApplied && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>
                    Cupom <strong>LANCAMENTO</strong> aplicado no Combo Carreiras!
                  </span>
                  <span className="font-bold text-emerald-400">R$ 9,90</span>
                </div>
              )}

              {isCouponTypedForWrongPlan && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-2">
                  <p>
                    O cupom <strong>LANCAMENTO</strong> (Lote Fundador por{" "}
                    <strong>R$ 9,90</strong>) é válido exclusivamente para o plano{" "}
                    <strong>Combo Carreiras (6 meses)</strong>.
                  </p>
                  {onChangePlan && (
                    <button
                      type="button"
                      onClick={() => onChangePlan("combo")}
                      className="text-xs font-bold text-amber-400 underline hover:text-amber-300"
                    >
                      Mudar para o Combo Carreiras por R$ 9,90 →
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || cpf.replace(/\D+/g, "").length < 11}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 py-3.5 text-sm font-bold text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Gerando QR Code Pix...
                </>
              ) : (
                <>
                  <QrCode size={18} /> Gerar Pix de R$ {formatBRL(pricing.value)}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>
                Pagamento único sem renovação automática • Garantia de 7 dias
              </span>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-52 h-52 rounded-2xl bg-white p-3 flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${charge.encodedImage}`}
                alt="QR Code Pix"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Pix Copia e Cola:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={charge.payload}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 px-3 text-xs text-emerald-300">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Aguardando pagamento... Liberação automática em segundos.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
