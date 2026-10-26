import React from "react";
import { BarChart3, Calendar, Target, Sparkles, Lock, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import { SubjectPieChart } from "@/components/dashboard/SubjectPieChart";
import { ConsistencyHeatmap } from "@/components/dashboard/ConsistencyHeatmap";
import { PremiumObserver } from "@/components/dashboard/PremiumObserver";
import { VerifyPaymentButton } from "@/components/dashboard/VerifyPaymentButton";
import { FocusWrapper } from "@/components/dashboard/FocusWrapper";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserProfile, getSubjectAnalytics } from "@/app/actions";
import { isPremium } from "@/lib/plans";

export default async function DashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const { data: chartData } = await getSubjectAnalytics();

  const premium = isPremium(profile);

  if (premium) {
    redirect("/vip");
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-[#090C15] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30 overflow-y-auto">
      {profile?.id && <PremiumObserver userId={profile.id} currentPlan={profile.plan || "free"} />}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Status de Login / Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-indigo-400" size={24} />
              <h1 className="text-3xl font-light tracking-tight text-white">
                Dashboard <span className="font-semibold">Geral</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                <CheckCircle2 size={14} /> Logado
              </span>
              <span className="text-slate-400">{profile.email}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/timer"
              className="px-6 py-2.5 rounded-full border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium text-slate-300 shadow-sm backdrop-blur-sm"
            >
              Voltar para o Foco
            </Link>
          </div>
        </header>

        {/* Persuasive Paywall Banner (Somente para Free) */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-slate-900/90 border border-indigo-500/30 p-1">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Lock size={300} className="transform rotate-12 -translate-y-20 translate-x-10" />
          </div>

          <div className="bg-slate-950/40 backdrop-blur-md rounded-[22px] p-8 md:p-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Left: Copywriting */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} /> Desbloqueie sua Aprovação
                </div>

                <h2 className="text-3xl md:text-4xl font-light text-white leading-tight">
                  Domine cada tópico do seu concurso com o{" "}
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Edital Verticalizado.
                  </span>
                </h2>

                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Você está no plano Básico. Pare de estudar no escuro: acesse a Área VIP para estruturar seu edital com I.A., classificar seu domínio com o Semáforo de Tópicos e medir suas horas reais em cada assunto.
                </p>

                <div className="pt-2">
                  <Link
                    href="/pricing"
                    className="w-full md:w-auto inline-flex bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 hover:-translate-y-1 tracking-wide items-center justify-center gap-2"
                  >
                    <Lock size={18} /> Quero ser Premium
                  </Link>
                  <p className="text-xs text-slate-500 text-center md:text-left mt-3">
                    Liberação instantânea via Pix.
                  </p>
                  <div className="flex justify-center md:justify-start">
                    <VerifyPaymentButton />
                  </div>
                </div>
              </div>

              {/* Right: Benefits Checklist */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 shrink-0">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Edital Verticalizado Inteligente (I.A.)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Envie o PDF ou texto do seu edital. Nossa I.A. extrai as matérias, organiza os tópicos e estima a carga horária ideal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Semáforo de Domínio por Tópico</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Classifique cada tópico com cores (Não iniciado, Não domino, Preciso revisar e Domino) e saiba exatamente onde focar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Tempo Líquido Conectado ao Timer</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Dê play direto no tópico do edital e acumule automaticamente as horas estudadas em cada disciplina e assunto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Free Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FocusWrapper
            title={
              <>
                <BarChart3 size={16} className="text-cyan-400" /> Alocação de Tempo
              </>
            }
          >
            <div className="h-[250px] w-full">
              <SubjectPieChart data={chartData} />
            </div>
          </FocusWrapper>

          <FocusWrapper
            title={
              <>
                <Calendar size={16} className="text-indigo-400" /> Mapa de Consistência
              </>
            }
          >
            <div className="w-full h-[250px] overflow-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col pt-4 px-2">
              <ConsistencyHeatmap />
            </div>
          </FocusWrapper>
        </div>
      </div>
    </div>
  );
}
