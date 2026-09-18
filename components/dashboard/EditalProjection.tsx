"use client";

import React, { useState } from "react";
import { Target, AlertCircle, CheckCircle2, Save, Loader2, Calendar } from "lucide-react";
import { saveEditalGoal } from "@/app/actions";
import { useRouter } from "next/navigation";

interface EditalGoal {
  exam_date: string;
  target_hours: number;
}

export function EditalProjection({ 
  initialGoal, 
  totalHours 
}: { 
  initialGoal: EditalGoal | null;
  totalHours: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // States para o form
  const [examDate, setExamDate] = useState("");
  const [targetHours, setTargetHours] = useState("");

  const handleSave = async () => {
    if (!examDate || !targetHours) return;
    setLoading(true);
    await saveEditalGoal({ examDate, targetHours: Number(targetHours) });
    router.refresh();
    setLoading(false);
  };

  // Se não tem meta, exibe form
  if (!initialGoal) {
    return (
      <div className="flex flex-col h-full justify-center">
        <p className="text-sm text-slate-400 mb-4">
          Configure sua meta de estudos para acompanharmos o ritmo ideal até o dia da sua prova.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Data da Prova</label>
            <input 
              type="date" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Meta (Horas Líquidas)</label>
            <input 
              type="number" 
              placeholder="Ex: 300"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors mt-1"
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={loading || !examDate || !targetHours}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Projeção
          </button>
        </div>
      </div>
    );
  }

  // Cálculos se tem meta
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(initialGoal.exam_date + "T00:00:00");
  
  const msRemaining = exam.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  
  const target = initialGoal.target_hours;
  const currentHoursTruncated = Number(totalHours.toFixed(1));
  const remainingHours = Math.max(0, target - totalHours);
  
  const requiredPace = daysRemaining > 0 ? (remainingHours / daysRemaining).toFixed(1) : 0;
  
  const progressPercent = Math.min((totalHours / target) * 100, 100);
  const isOnTrack = totalHours >= target;

  if (daysRemaining === 0 && !isOnTrack) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-center">
        <Calendar size={48} className="text-slate-700 mb-3" />
        <h4 className="text-lg text-slate-200 font-medium">Chegou o dia!</h4>
        <p className="text-sm text-slate-400 mt-2">Dê o seu melhor na prova. Boa sorte!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-3xl font-light text-slate-100">{daysRemaining}</span>
          <span className="text-sm font-medium text-slate-500 mb-1">dias para a prova</span>
        </div>
        
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progresso</span>
            <span className="text-slate-200 font-medium">{currentHoursTruncated}h de {target}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ritmo Necessário</span>
            <span className="text-slate-200 font-medium">{requiredPace}h / dia</span>
          </div>
        </div>
      </div>

      <div className={`mt-6 p-3 rounded-lg border flex items-start gap-3 text-sm
        ${progressPercent >= 100 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
        }`}
      >
        {progressPercent >= 100 ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        )}
        <p>
          {progressPercent >= 100 
            ? "Meta de horas concluída! O edital está coberto. Foque agora em revisar seus pontos fracos."
            : `Para bater a meta antes da prova, você precisa estudar cerca de ${requiredPace}h todos os dias a partir de hoje.`}
        </p>
      </div>
    </div>
  );
}
