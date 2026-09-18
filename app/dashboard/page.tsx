import React from "react";
import { BarChart3, Calendar, BrainCircuit, Target, Headphones, Sparkles, Lock } from "lucide-react";
import { SubjectPieChart } from "@/components/dashboard/SubjectPieChart";
import { ConsistencyHeatmap } from "@/components/dashboard/ConsistencyHeatmap";
import { SmartCycle } from "@/components/dashboard/SmartCycle";
import { EditalProjection } from "@/components/dashboard/EditalProjection";
import { AmbientSounds } from "@/components/dashboard/AmbientSounds";
import { PremiumObserver } from "@/components/dashboard/PremiumObserver";
import { VerifyPaymentButton } from "@/components/dashboard/VerifyPaymentButton";
import Link from "next/link";

import { getUserProfile, getSubjectAnalytics, getEditalGoal, getTotalStudiedHours, getTodayReviews } from "@/app/actions";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const { data: chartData } = await getSubjectAnalytics();
  
  const editalGoal = await getEditalGoal();
  const totalHours = await getTotalStudiedHours();
  const todayReviews = await getTodayReviews();
  
  const isPremium = profile?.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      {profile?.id && <PremiumObserver userId={profile.id} currentPlan={profile.plan || 'free'} />}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header - Minimalist */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-indigo-400" size={24} />
              <h1 className="text-3xl font-light tracking-tight text-white">
                Dashboard <span className="font-semibold">Premium</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide">VISÃO ESTRATÉGICA DOS SEUS ESTUDOS</p>
          </div>
          
          <Link href="/timer" className="px-6 py-2.5 rounded-full border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium text-slate-300 shadow-sm backdrop-blur-sm">
            Voltar para o Foco
          </Link>
        </header>

        {/* Persuasive Paywall Banner */}
        {!isPremium && (
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
                    Concurseiros que analisam métricas passam <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">3x mais rápido.</span>
                  </h2>
                  
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                    Você está vendo uma simulação. Pare de estudar no escuro: sincronize seu histórico na nuvem, identifique seus pontos fracos e use a nossa Inteligência para automatizar seu ciclo de revisões.
                  </p>

                  <div className="pt-2">
                    <Link href="/pricing" className="w-full md:w-auto inline-flex bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 hover:-translate-y-1 tracking-wide items-center justify-center gap-2">
                      <Lock size={18} /> Quero ser Premium
                    </Link>
                    <p className="text-xs text-slate-500 text-center md:text-left mt-3">
                      Por menos do valor de um lanche por mês.
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
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200">Sincronização em Nuvem</h4>
                      <p className="text-xs text-slate-400 mt-1">Nunca perca suas horas líquidas. Seus dados blindados e acessíveis em qualquer dispositivo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400 shrink-0">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200">Ciclo Inteligente (IA)</h4>
                      <p className="text-xs text-slate-400 mt-1">O algoritmo sugere automaticamente o que você deve revisar com base no peso e no seu histórico.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 shrink-0">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200">Foco Profundo (Áudios)</h4>
                      <p className="text-xs text-slate-400 mt-1">Biblioteca exclusiva de ruídos brancos e sons binaurais comprovados para aumentar a concentração.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid - Clean / Aesthetic borders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top row in main column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-slate-700/80">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} className="text-cyan-400" /> Alocação de Tempo
                  </h3>
                </div>
                <div className="h-[250px] w-full">
                  <SubjectPieChart data={chartData} />
                </div>
              </section>

              <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-slate-700/80">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} className="text-emerald-400" /> Projeção de Edital
                  </h3>
                </div>
                <EditalProjection initialGoal={editalGoal} totalHours={totalHours} />
              </section>
            </div>

            {/* Heatmap Row */}
            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-slate-700/80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" /> Mapa de Consistência Anual
                </h3>
              </div>
              <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                <ConsistencyHeatmap />
              </div>
            </section>
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 space-y-6">
            
            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-slate-700/80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit size={16} className="text-purple-400" /> Ciclo Inteligente (SM-2)
                </h3>
              </div>
              <SmartCycle reviews={todayReviews} />
            </section>

            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-slate-700/80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Headphones size={16} className="text-amber-400" /> Foco Profundo (Áudio)
                </h3>
              </div>
              <AmbientSounds />
            </section>
            
          </div>

        </div>
      </div>
    </div>
  );
}
