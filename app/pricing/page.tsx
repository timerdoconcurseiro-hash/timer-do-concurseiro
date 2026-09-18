"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Zap, ArrowLeft } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4 selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            Estude com <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Inteligência</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Desbloqueie projeções de edital, ciclos sugeridos por IA e sons binaurais. Foque no que importa: a sua aprovação.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Plano Anual */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col backdrop-blur-sm relative">
            <h3 className="text-xl font-medium text-slate-300">Acesso Anual</h3>
            <div className="mt-4 flex items-baseline text-5xl font-bold text-white">
              <span className="text-2xl text-slate-500 font-medium mr-1">R$</span>19<span className="text-2xl text-slate-500 font-medium">,90</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">Menos de R$ 1,65 por mês.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={20}/> Sincronização em Nuvem (1 ano)</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={20}/> Dashboard VIP de Produtividade</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={20}/> Suporte via e-mail</li>
            </ul>

            <a 
              href="https://www.asaas.com/c/rl7enqcioxuv7lax"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-4 rounded-xl font-bold transition-all text-center"
            >
              Assinar Anual
            </a>
          </div>

          {/* Plano Vitalício (Destaque) */}
          <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900/80 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                Recomendado
              </span>
            </div>
            
            <h3 className="text-xl font-medium text-indigo-300 flex items-center gap-2">
              <Zap size={20} /> Acesso Vitalício
            </h3>
            <div className="mt-4 flex items-baseline text-5xl font-bold text-white">
              <span className="text-2xl text-indigo-300 font-medium mr-1">R$</span>34<span className="text-2xl text-indigo-300 font-medium">,90</span>
            </div>
            <p className="text-indigo-200/60 text-sm mt-2">Pagamento Único. Seu para sempre.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Tudo do plano Anual, para sempre</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Ciclo Inteligente (IA de Revisão)</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Player de Foco Profundo (Binaurais)</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Projeção Automática de Edital</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Atualizações futuras garantidas</li>
            </ul>

            <a 
              href="https://www.asaas.com/c/y8o2lixxmjz22dsr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.3)] text-center text-lg"
            >
              Garantir Vitalício
            </a>
          </div>

        </div>

        {/* Garantia */}
        <div className="max-w-2xl mx-auto mt-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-full shrink-0">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1">Risco Zero: Garantia Incondicional de 7 Dias</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Use a Inteligência Artificial, os Sons Binaurais e a Projeção de Edital no seu estudo desta semana. Se você não sentir que seu foco e controle dobraram em 7 dias, mande um único e-mail e nós devolveremos 100% do valor na hora, sem perguntas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
