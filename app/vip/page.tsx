import React from "react";
import { BrainCircuit, Target, Headphones, Sparkles, Lock, ArrowLeft } from "lucide-react";
import { SmartCycle } from "@/components/dashboard/SmartCycle";
import { EditalProjection } from "@/components/dashboard/EditalProjection";
import { AmbientSounds } from "@/components/dashboard/AmbientSounds";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserProfile, getEditalGoal, getTotalStudiedHours, getTodayReviews, getSubjectAnalytics } from "@/app/actions";
import { SubjectPieChart } from "@/components/dashboard/SubjectPieChart";
import { ConsistencyHeatmap } from "@/components/dashboard/ConsistencyHeatmap";
import { BarChart3, Calendar } from "lucide-react";

export default async function VIPPage() {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/login");
  }

  const isPremium = profile?.plan === 'premium';

  if (!isPremium) {
    redirect("/dashboard");
  }

  const editalGoal = await getEditalGoal();
  const totalHours = await getTotalStudiedHours();
  const todayReviews = await getTodayReviews();
  const { data: chartData } = await getSubjectAnalytics();

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header - VIP */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-amber-400" size={24} />
              <h1 className="text-3xl font-light tracking-tight text-white">
                Área <span className="font-semibold text-amber-400">VIP</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide">
              {profile.email} • MÓDULOS DE ALTA PERFORMANCE
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} /> Voltar ao Dashboard
            </Link>
            <Link href="/timer" className="px-6 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all text-sm font-medium shadow-sm backdrop-blur-sm">
              Ir para o Timer
            </Link>
          </div>
        </header>

        {/* VIP Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top row in main column - Gráficos de Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} className="text-cyan-400" /> Alocação de Tempo
                  </h3>
                </div>
                <div className="h-[250px] w-full">
                  <SubjectPieChart data={chartData} />
                </div>
              </section>

              <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-400" /> Consistência
                  </h3>
                </div>
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 flex items-center justify-center h-[250px]">
                  <ConsistencyHeatmap />
                </div>
              </section>
            </div>
            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Target size={16} className="text-emerald-400" /> Projeção de Edital
                </h3>
              </div>
              <EditalProjection initialGoal={editalGoal} totalHours={totalHours} />
            </section>

            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Headphones size={16} className="text-amber-400" /> Foco Profundo (Sintetizador Binaural)
                </h3>
              </div>
              <AmbientSounds />
            </section>
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit size={16} className="text-purple-400" /> Ciclo Inteligente (SM-2)
                </h3>
              </div>
              <SmartCycle reviews={todayReviews} />
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
