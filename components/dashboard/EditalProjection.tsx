"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Save, Loader2, Calendar, Edit2, X } from "lucide-react";
import { saveEditalGoal } from "@/app/actions";
import { useRouter } from "next/navigation";

interface EditalGoal {
  exam_date: string;
  target_hours: number;
}

export function EditalProjection({
  initialGoal,
  totalHours,
}: {
  initialGoal: EditalGoal | null;
  totalHours: number;
}) {
  const router = useRouter();
  const [goal, setGoal] = useState<EditalGoal | null>(initialGoal);
  const [editing, setEditing] = useState(!initialGoal);
  const [loading, setLoading] = useState(false);

  const [examDate, setExamDate] = useState(initialGoal?.exam_date || "");
  const [targetHours, setTargetHours] = useState(
    initialGoal?.target_hours ? String(initialGoal.target_hours) : ""
  );

  useEffect(() => {
    setGoal(initialGoal);
    if (initialGoal) {
      setExamDate(initialGoal.exam_date);
      setTargetHours(String(initialGoal.target_hours));
    }
  }, [initialGoal]);

  const handleSave = async () => {
    if (!examDate || !targetHours) return;
    setLoading(true);
    const hours = Math.max(1, Number(targetHours) || 1);
    const res = await saveEditalGoal({ examDate, targetHours: hours });
    setLoading(false);
    if (res.success) {
      setGoal({ exam_date: examDate, target_hours: hours });
      setEditing(false);
      router.refresh();
    }
  };

  if (!goal || editing) {
    return (
      <div className="flex flex-col h-full justify-center">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400">
            Configure a data da sua prova e a meta de horas líquidas.
          </p>
          {goal && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-slate-500 hover:text-white p-1"
              title="Cancelar"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Data da Prova</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Meta (Horas Líquidas)</label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 300"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors mt-1"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !examDate || !targetHours}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Projeção
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(goal.exam_date + "T00:00:00");

  const msRemaining = exam.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  const target = Math.max(1, goal.target_hours);
  const currentHoursTruncated = Number(totalHours.toFixed(1));
  const remainingHours = Math.max(0, target - totalHours);

  const requiredPace = daysRemaining > 0 ? (remainingHours / daysRemaining).toFixed(1) : "0";
  const progressPercent = Math.min((totalHours / target) * 100, 100);

  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{daysRemaining}</span>
            <span className="text-xs font-medium text-slate-400">dias para a prova</span>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-slate-500 hover:text-amber-400 p-1 transition-colors"
            title="Editar data/meta"
          >
            <Edit2 size={14} />
          </button>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progressPercent >= 100 ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Horas Acumuladas</span>
            <span className="text-slate-200 font-semibold">
              {currentHoursTruncated}h / {target}h ({Math.round(progressPercent)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Ritmo Necessário</span>
            <span className="text-amber-300 font-bold">{requiredPace}h / dia</span>
          </div>
        </div>
      </div>

      <div
        className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
          progressPercent >= 100
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/20 text-amber-200"
        }`}
      >
        {progressPercent >= 100 ? (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
        ) : (
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        )}
        <p>
          {progressPercent >= 100
            ? "Meta de horas batida! Foque em simulados e revisão de pontos fracos."
            : daysRemaining === 0
              ? "Chegou o dia da prova! Confie na sua preparação."
              : `Estude ~${requiredPace}h líquidas por dia para bater a meta até ${new Date(
                  goal.exam_date + "T12:00:00"
                ).toLocaleDateString("pt-BR")}.`}
        </p>
      </div>
    </div>
  );
}
