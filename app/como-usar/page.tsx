"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Timer, BarChart3, Cloud, Save, Headphones } from 'lucide-react';

export default function ComoUsarPage() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            Guia Rápido: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Como Usar</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Aprenda a extrair o máximo do Timer do Concurseiro e transformar suas horas de estudo em aprovação.
          </p>
        </div>

        {/* Passo a Passo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Target className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">1. Defina sua Meta Diária</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No topo da tela inicial, ajuste a sua meta de <strong>Horas Líquidas</strong> diárias. O anel de progresso vai preenchendo automaticamente conforme você estuda. Atingir a meta gera um alerta de conquista e aumenta o seu <em>Streak</em> (dias seguidos de foco).
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Timer className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">2. Escolha o Modo de Estudo</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Alterne entre o <strong>Temporizador (Pomodoro)</strong> para contagem regressiva e pausas estratégicas, ou o <strong>Cronômetro</strong> para estudos contínuos de longo prazo (como simulados e leituras extensas).
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Save className="text-amber-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3. Registre a Matéria</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Assim que o tempo acabar ou você pausar, digite o nome da matéria (ex: Direito Constitucional) e clique em <strong>Salvar Sessão</strong>. Somente os minutos que você passou efetivamente com o timer rodando (horas líquidas) serão contabilizados.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Cloud className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">4. Não perca seus dados</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O aplicativo salva os dados no seu navegador, mas se você limpar o cache, perderá tudo. Faça o <strong>Login Seguro com o Google</strong> para sincronizar todo o seu histórico e horas diretamente na nuvem!
            </p>
          </div>

        </div>

        {/* Secao Área VIP */}
        <div className="mt-12 bg-gradient-to-br from-indigo-900/20 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              Recurso Avançado
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Extraia o máximo com o <br/>Dashboard Premium
            </h3>
            <p className="text-slate-400">
              Transforme seus dados salvos em aprovação matemática.
            </p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-center justify-center md:justify-start gap-3 text-sm text-slate-300">
                <BarChart3 size={18} className="text-cyan-400" /> <strong>Gráfico de Alocação:</strong> Veja onde você investe mais tempo.
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-sm text-slate-300">
                <Target size={18} className="text-emerald-400" /> <strong>Ciclo de IA:</strong> O app diz a próxima matéria a revisar.
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-sm text-slate-300">
                <Headphones size={18} className="text-amber-400" /> <strong>Foco Profundo:</strong> Sons binaurais exclusivos para concentrar.
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-1/3">
            <Link 
              href="/pricing"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center py-4 rounded-full font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105"
            >
              Conhecer Área VIP
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
