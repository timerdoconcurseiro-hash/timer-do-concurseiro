"use client";

import React, { useState } from "react";
import { CheckCircle, Play, Sparkles, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { toggleTopicCompleted } from "@/app/actions";
import { useRouter } from "next/navigation";

export function DailyMissions({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  
  if (!initialData || initialData.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center bg-slate-900/40 rounded-xl border border-slate-800">
        Cadastre seu edital primeiro para que a Inteligência Artificial possa gerar as suas missões diárias.
      </div>
    );
  }

  // Acha os primeiros 3 tópicos não concluídos do edital para gerar a missão do dia
  let pendingTopics: any[] = [];
  for (const subject of initialData) {
    for (const topic of subject.edital_topics) {
      if (!topic.completed) {
        pendingTopics.push({ ...topic, subjectName: subject.name });
      }
      if (pendingTopics.length >= 3) break;
    }
    if (pendingTopics.length >= 3) break;
  }

  if (pendingTopics.length === 0) {
    return (
      <div className="p-6 bg-emerald-900/20 rounded-xl border border-emerald-900/50 text-center">
        <Sparkles className="text-emerald-400 mx-auto mb-3" size={32} />
        <h4 className="text-emerald-400 font-bold mb-2">Edital Finalizado!</h4>
        <p className="text-sm text-emerald-200/70">Você concluiu todos os tópicos do seu edital. Incrível!</p>
      </div>
    );
  }

  const handleComplete = async (topicId: string) => {
    await toggleTopicCompleted(topicId, true);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 mb-2">
        <h4 className="text-amber-400 font-bold text-sm flex items-center gap-2">
          <Sparkles size={16} /> Cronograma Inteligente de Hoje
        </h4>
        <p className="text-xs text-amber-200/80 mt-1">
          A IA analisou as pendências do seu edital e separou essas metas para você focar hoje.
        </p>
      </div>

      <div className="space-y-3">
        {pendingTopics.map((topic, index) => (
          <div key={topic.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors">
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Missão {index + 1} • {topic.subjectName}
                </span>
                <h5 className="text-sm font-semibold text-slate-200 mb-2">{topic.name}</h5>
                
                <div className="flex gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><BookOpen size={12} /> Teoria + Questões</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> ~1h15m</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link 
                  href={`/timer?subject=${encodeURIComponent(topic.subjectName)}&topic=${encodeURIComponent(topic.name)}&topicId=${topic.id}&duration=4500`}
                  className="bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  title="Iniciar Timer para esta missão"
                >
                  <Play size={16} className="ml-1" />
                </Link>
                <button 
                  onClick={() => handleComplete(topic.id)}
                  className="bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  title="Marcar missão como concluída"
                >
                  <CheckCircle size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
