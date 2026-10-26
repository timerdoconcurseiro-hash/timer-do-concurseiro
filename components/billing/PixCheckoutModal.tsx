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
} from "lucide-react";
import { PLAN_CATALOG, type PlanCode } from "@/lib/plans";

interface PixCheckoutModalProps {
  planCode: PlanCode | null;
  onClose: () => void;
}

interface PixChargeData {
  paymentId: string;
  value: number;
  planLabel: string;
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

export function PixCheckoutModal({ planCode, onClose }: PixCheckoutModalProps) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
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

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planCode, cpfCnpj: cpf }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Não foi possível gerar o QR Code Pix.");
      }
      setCharge(json as PixChargeData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao comunicar com o gateway Pix.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1323] p-6 md:p-8 text-slate-200 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
          aria-label="Fechar checkout"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <QrCode size={14} /> Checkout Pix Instantâneo
          </div>
          <h3 className="text-2xl font-bold text-white">
            Plano {plan.label} —{" "}
            <span className="text-indigo-400">
              R$ {plan.value.toFixed(2).replace(".", ",")}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Liberação automática da Área VIP em segundos após o pagamento.
          </p>
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
              Redirecionando você para a Área VIP...
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
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || cpf.replace(/\D+/g, "").length < 11}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Gerando QR Code Pix...
                </>
              ) : (
                <>
                  <QrCode size={18} /> Gerar QR Code Pix
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-400" />
              Processado com segurança via Asaas • Garantia de 7 dias
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
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 px-3 text-xs text-indigo-300">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Aguardando pagamento... A tela atualizará sozinha.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
