import React from "react";
import { BrainCircuit, Target, Headphones, Sparkles, Lock, ArrowLeft, BarChart3, Calendar } from "lucide-react";
import { SmartCycle } from "@/components/dashboard/SmartCycle";
import { EditalVerticalizado } from "@/components/dashboard/EditalVerticalizado";
import { AmbientSounds } from "@/components/dashboard/AmbientSounds";
import { FocusWrapper } from "@/components/dashboard/FocusWrapper";
import { AIStudyRoom } from "@/components/dashboard/AIStudyRoom";
import { DailyMissions } from "@/components/dashboard/DailyMissions";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserProfile, getEditalVerticalizado, getTodayReviews, getSubjectAnalytics } from "@/app/actions";
import { SubjectPieChart } from "@/components/dashboard/SubjectPieChart";
import { ConsistencyHeatmap } from "@/components/dashboard/ConsistencyHeatmap";

export default async function VIPPage() {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/login");
  }

  const isPremium = profile?.plan === 'premium';

  if (!isPremium) {
    redirect("/dashboard");
  }

  const { data: editalData } = await getEditalVerticalizado();
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
              <FocusWrapper title={<><BarChart3 size={16} className="text-cyan-400" /> Alocação de Tempo</>}>
                <div className="h-[250px] w-full">
                  <SubjectPieChart data={chartData} />
                </div>
              </FocusWrapper>

              <FocusWrapper title={<><Calendar size={16} className="text-indigo-400" /> Consistência</>}>
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 flex items-center justify-center h-[250px]">
                  <ConsistencyHeatmap />
                </div>
              </FocusWrapper>
            </div>
            
            <FocusWrapper title={<><Target size={16} className="text-emerald-400" /> Edital Verticalizado Inteligente</>}>
              <EditalVerticalizado initialData={editalData || []} />
            </FocusWrapper>

            <FocusWrapper title={<><Headphones size={16} className="text-amber-400" /> Sintetizador Binaural Focus</>}>
              <AmbientSounds />
            </FocusWrapper>

            <FocusWrapper title={<><BrainCircuit size={16} className="text-blue-400" /> Sala de Leitura IA (Gerador de Resumos e Flashcards)</>}>
              <AIStudyRoom />
            </FocusWrapper>
            
          </div>

          {/* Right Column - Sidebars */}
          <div className="lg:col-span-4 space-y-6">
            
            <FocusWrapper title={<><Sparkles size={16} className="text-amber-400" /> Missões de Hoje (Cronograma)</>}>
              <DailyMissions initialData={editalData || []} />
            </FocusWrapper>

            <FocusWrapper title={<><BrainCircuit size={16} className="text-fuchsia-400" /> Smart Cycle (Revisão Espaçada)</>}>
              <SmartCycle reviews={todayReviews} />
            </FocusWrapper>
          </div>
          
        </div>
      </div>
    </div>
  );
}
