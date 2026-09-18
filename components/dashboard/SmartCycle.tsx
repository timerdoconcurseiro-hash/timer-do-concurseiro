"use client";

import React, { useState } from "react";
import { ArrowRight, BookOpen, Clock, Target, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { markReviewCompleted } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SmartCycle({ reviews }: { reviews: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleComplete = async (id: string) => {
    setLoadingId(id);
    await markReviewCompleted(id);
    router.refresh();
    setLoadingId(null);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles size={40} className="text-purple-400 mb-4 opacity-50" />
        <h4 className="text-slate-200 font-medium mb-2">Tudo em dia!</h4>
        <p className="text-slate-400 text-sm mb-4">
          Você não tem revisões agendadas para hoje. Continue estudando novas matérias para o algoritmo trabalhar!
        </p>
        <Link 
          href="/timer" 
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          Ir para o Timer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((item, index) => {
        // Formatar se está atrasado
        const today = new Date().toISOString().split('T')[0];
        const isLate = item.review_date < today;

        return (
          <div 
            key={item.id} 
            className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 text-purple-400 bg-purple-400/10 p-2 rounded-full">
                <BookOpen size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">{item.subject}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Target size={12} /> 
                  {item.topic ? item.topic : 'Revisão Geral'} 
                  {isLate && <span className="text-amber-400 ml-1 font-semibold">• Atrasada</span>}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-bold px-2 py-1 bg-slate-800 text-slate-300 rounded-md flex items-center gap-1">
                <Clock size={12} /> Rápida
              </span>
              <button 
                onClick={() => handleComplete(item.id)}
                disabled={loadingId === item.id}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1 transition-all"
              >
                {loadingId === item.id ? (
                  <><Loader2 size={14} className="animate-spin" /> Concluindo...</>
                ) : (
                  <><CheckCircle2 size={14} /> Feito!</>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
