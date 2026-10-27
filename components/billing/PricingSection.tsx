"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Clock,
  Award,
  ArrowLeft,
  Lock,
  QrCode,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isPlanCode, PLAN_CATALOG, type PlanCode } from "@/lib/plans";
import { PixCheckoutModal } from "@/components/billing/PixCheckoutModal";
import { VerifyPaymentButton } from "@/components/dashboard/VerifyPaymentButton";

interface PricingSectionProps {
  showBackLink?: boolean;
}

const FAQ_ITEMS = [
  {
    question: "Há renovação automática ou cobrança recorrente no cartão?",
    answer:
      "Não! Nosso modelo é 100% pré-pago via Pix por pagamento único. Você paga apenas pelo período escolhido (4, 6 ou 12 meses) sem risco de cobranças surpresas ou fidelidade oculta.",
  },
  {
    question: "Em quanto tempo meu acesso à Área VIP é liberado?",
    answer:
      "Imediatamente! Assim que você escaneia o QR Code ou usa o Pix Copia e Cola no seu banco, nosso webhook confirma o pagamento em poucos segundos e redireciona sua tela automaticamente para a Área VIP.",
  },
  {
    question: "Como funciona o Semáforo de Domínio (⚪ 🔴 🟡 🟢) e o Timer por tópico?",
    answer:
      "Você importa ou cola o texto do seu edital e a nossa IA organiza todas as matérias e tópicos. Em cada tópico você marca seu nível (Não iniciado, Não domino, Preciso revisar ou Domino) e dá Play direto no tópico para acumular horas líquidas reais.",
  },
  {
    question: "Posso usar tanto no celular quanto no computador?",
    answer:
      "Sim! A plataforma é 100% responsiva e sincronizada na nuvem. Você pode cronometrar seus estudos pelo celular e revisar seu Edital Verticalizado no notebook ou tablet sem perder nenhum segundo.",
  },
];

function splitPriceParts(value: number): { reais: string; centavos: string } {
  const [reais, centavos] = value.toFixed(2).split(".");
  return { reais, centavos };
}

export function PricingSection({ showBackLink = true }: PricingSectionProps) {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null);
  const [initialCoupon, setInitialCoupon] = useState<string>("");

  const salesOpen = process.env.NEXT_PUBLIC_SALES_OPEN !== "false";

  // Permite abrir automaticamente via /pricing?plan=combo&coupon=LANCAMENTO ou /checkout?plan=combo
  useEffect(() => {
    const planParam = searchParams.get("plan");
    const couponParam = searchParams.get("coupon");
    if (isPlanCode(planParam) && salesOpen) {
      const timer = setTimeout(() => {
        if (couponParam) setInitialCoupon(couponParam.toUpperCase());
        setSelectedPlan(planParam);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, salesOpen]);

  const handleSelectPlan = async (plan: PlanCode) => {
    if (!salesOpen) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const redirectUrl = new URL("/pricing", window.location.origin);
      redirectUrl.searchParams.set("plan", plan);
      const couponParam = searchParams.get("coupon");
      if (couponParam) {
        redirectUrl.searchParams.set("coupon", couponParam);
      }

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
        },
      });
      return;
    }

    setSelectedPlan(plan);
  };

  const sprint = PLAN_CATALOG.sprint;
  const combo = PLAN_CATALOG.combo;
  const anual = PLAN_CATALOG.anual;

  const sprintParts = splitPriceParts(sprint.value);
  const comboParts = splitPriceParts(combo.value);
  const anualParts = splitPriceParts(anual.value);

  return (
    <section className="min-h-screen bg-slate-950 text-slate-200 py-12 md:py-20 px-4 selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Comercial */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {showBackLink && (
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5"
              >
                <ArrowLeft size={14} /> Voltar ao Dashboard
              </Link>
            </div>
          )}

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles size={14} /> Pagamento Único via Pix • Sem Fidelidade ou Mensalidades
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Escolha o ciclo ideal para a sua{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-500">
              Nomeação
            </span>
          </h1>

          {!salesOpen && (
            <p className="text-amber-400 text-base font-medium">
              Conheça nossos planos — abertura de vagas em breve!
            </p>
          )}

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Verticalize qualquer edital com Inteligência Artificial, controle seu nível de
            domínio no <strong className="text-slate-200">Semáforo D2 (⚪ 🔴 🟡 🟢)</strong> e
            acumule horas líquidas reais em cada tópico.
          </p>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* PLANO 1: SPRINT PÓS-EDITAL */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-7 sm:p-8 flex flex-col justify-between backdrop-blur-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Zap size={15} /> Foco Imediato
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800/80 border border-slate-700/70 px-2.5 py-1 rounded-full">
                  <Clock size={12} className="text-emerald-400" /> {sprint.durationLabel}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mt-4">{sprint.label}</h2>
              <p className="text-xs text-slate-400 mt-1">{sprint.limitLabel}</p>

              <div className="mt-6 space-y-1">
                <div className="text-xs text-slate-500 line-through">
                  De R$ {sprint.originalValue.toFixed(2).replace(".", ",")}
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-lg font-semibold text-slate-400 mr-1">R$</span>
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {sprintParts.reais}
                  </span>
                  <span className="text-xl font-bold text-slate-300">
                    ,{sprintParts.centavos}
                  </span>
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    / pagamento único
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-medium pt-1">
                  {sprint.subtext}
                </p>
              </div>

              <div className="my-6 h-px bg-slate-800/80" />

              <ul className="space-y-3.5">
                {sprint.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="mt-0.5 rounded-full bg-emerald-500/15 p-1 text-emerald-400 shrink-0">
                      <Check size={14} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={() => handleSelectPlan("sprint")}
                disabled={!salesOpen}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !salesOpen
                    ? "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white border border-slate-700 hover:border-emerald-400"
                }`}
              >
                {!salesOpen ? <Lock size={16} /> : <QrCode size={16} />}
                Liberar Sprint via Pix
              </button>
            </div>
          </div>

          {/* PLANO 2: COMBO CARREIRAS (DESTAQUE) */}
          <div className="relative bg-slate-900/60 border-2 border-amber-500/50 rounded-3xl p-7 sm:p-8 flex flex-col justify-between backdrop-blur-sm shadow-[0_0_45px_-10px_rgba(245,158,11,0.25)] lg:-translate-y-3 transition-all">
            {combo.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-lg">
                  {combo.badge}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles size={15} /> Melhor Custo-Benefício
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-200 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  <Clock size={12} className="text-amber-400" /> {combo.durationLabel}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mt-4">{combo.label}</h2>
              <p className="text-xs text-amber-300/90 font-medium mt-1">
                {combo.limitLabel}
              </p>

              <div className="mt-6 space-y-1">
                <div className="text-xs text-slate-500 line-through">
                  De R$ {combo.originalValue.toFixed(2).replace(".", ",")}
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-lg font-semibold text-amber-400 mr-1">R$</span>
                  <span className="text-5xl font-extrabold tracking-tight text-white">
                    {comboParts.reais}
                  </span>
                  <span className="text-2xl font-bold text-amber-400">
                    ,{comboParts.centavos}
                  </span>
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    / pagamento único
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold pt-1">
                  {combo.subtext}
                </p>
              </div>

              <div className="my-6 h-px bg-amber-500/20" />

              <ul className="space-y-3.5">
                {combo.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-3 text-sm text-slate-100 font-medium"
                  >
                    <div className="mt-0.5 rounded-full bg-amber-500/20 p-1 text-amber-400 shrink-0">
                      <Check size={14} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => handleSelectPlan("combo")}
                disabled={!salesOpen}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !salesOpen
                    ? "bg-amber-900/40 text-amber-300/50 opacity-50 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:scale-[1.02]"
                }`}
              >
                {!salesOpen ? <Lock size={16} /> : <QrCode size={18} />}
                Garantir Combo Carreiras via Pix
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Tem cupom de fundador? Aplique na próxima tela.
              </p>
            </div>
          </div>

          {/* PLANO 3: PASSAPORTE ANUAL */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-7 sm:p-8 flex flex-col justify-between backdrop-blur-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Award size={15} /> Ciclo Completo
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800/80 border border-slate-700/70 px-2.5 py-1 rounded-full">
                  <Clock size={12} className="text-emerald-400" /> {anual.durationLabel}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mt-4">{anual.label}</h2>
              <p className="text-xs text-emerald-400 font-medium mt-1">
                {anual.limitLabel}
              </p>

              <div className="mt-6 space-y-1">
                <div className="text-xs text-slate-500 line-through">
                  De R$ {anual.originalValue.toFixed(2).replace(".", ",")}
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-lg font-semibold text-slate-400 mr-1">R$</span>
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {anualParts.reais}
                  </span>
                  <span className="text-xl font-bold text-slate-300">
                    ,{anualParts.centavos}
                  </span>
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    / pagamento único
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-medium pt-1">
                  {anual.subtext}
                </p>
              </div>

              <div className="my-6 h-px bg-slate-800/80" />

              <ul className="space-y-3.5">
                {anual.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="mt-0.5 rounded-full bg-emerald-500/15 p-1 text-emerald-400 shrink-0">
                      <Check size={14} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={() => handleSelectPlan("anual")}
                disabled={!salesOpen}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !salesOpen
                    ? "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white border border-slate-700 hover:border-emerald-400"
                }`}
              >
                {!salesOpen ? <Lock size={16} /> : <QrCode size={16} />}
                Liberar Passaporte Anual
              </button>
            </div>
          </div>
        </div>

        {/* Garantia Incondicional de 7 Dias */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-emerald-500/25 bg-slate-900/60 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={36} className="text-emerald-400" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Garantia Incondicional de 7 Dias (Risco Zero)
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Entre na Área VIP, importe seu edital e teste o Semáforo D2 com o Timer
              integrado por 7 dias. Se por qualquer motivo você sentir que a ferramenta
              não acelerou a sua organização de estudos, devolvemos{" "}
              <strong className="text-slate-200">100% do seu Pix</strong> sem burocracia
              (Art. 49 do CDC).
            </p>
          </div>
        </div>

        {/* FAQ Anti-Fricção */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <HelpCircle size={14} /> Dúvidas Frequentes
            </div>
            <h3 className="text-2xl font-bold text-white">
              Perguntas sobre o Acesso VIP
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2"
              >
                <h4 className="text-sm font-bold text-white flex items-start gap-2">
                  <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{item.question}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Verificação Manual de Pagamento */}
        <div className="pt-2 flex justify-center">
          <VerifyPaymentButton />
        </div>
      </div>

      <PixCheckoutModal
        key={`${selectedPlan ?? "closed"}:${initialCoupon}`}
        planCode={selectedPlan}
        initialCoupon={initialCoupon}
        onClose={() => setSelectedPlan(null)}
        onChangePlan={(nextPlan) => setSelectedPlan(nextPlan)}
      />
    </section>
  );
}
