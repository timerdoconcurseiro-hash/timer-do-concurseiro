"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Play, CalendarClock, Sparkles, Loader2 } from "lucide-react";
import { markReviewCompleted, postponeReview } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface SpacedReviewItem {
  id: string;
  subject: string;
  topic?: string | null;
  review_date: string;
  status: string;
}

export function SpacedReviewsWidget({ initialReviews }: { initialReviews: SpacedReviewItem[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<SpacedReviewItem[]>(initialReviews || []);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setReviews(initialReviews || []);
  }, [initialReviews]);

  const handleComplete = async (id: string) => {
    setBusyId(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    await markReviewCompleted(id);
    setBusyId(null);
    router.refresh();
  };

  const handlePostpone = async (id: string) => {
    setBusyId(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    await postponeReview(id, 1);
    setBusyId(null);
    router.refresh();
  };

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles size={36} className="text-emerald-400 mb-3 opacity-70" />
        <h4 className="text-slate-200 font-medium text-sm mb-1">Revisões em Dia!</h4>
        <p className="text-slate-400 text-xs leading-relaxed">
          Nenhuma revisão pendente para hoje. Ao concluir sessões no Timer, agendamos automaticamente suas revisões de 24h, 7d e 30d.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
      {reviews.map((rev) => {
        const isBusy = busyId === rev.id;
        const formattedDate = new Date(rev.review_date + "T12:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        });

        return (
          <div
            key={rev.id}
            className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-0.5">
                <Clock size={11} /> Programada: {formattedDate}
              </div>
              <h5 className="text-sm font-bold text-slate-200 truncate">{rev.subject}</h5>
              {rev.topic && <p className="text-xs text-slate-400 truncate mt-0.5">{rev.topic}</p>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/timer?subject=${encodeURIComponent(rev.subject)}${
                  rev.topic ? `&topic=${encodeURIComponent(rev.topic)}` : ""
                }&duration=1500`}
                className="p-2 rounded-full bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors"
                title="Revisar 25 min no Timer"
              >
                <Play size={14} className="ml-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => handlePostpone(rev.id)}
                disabled={isBusy}
                className="p-2 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition-colors disabled:opacity-40"
                title="Adiar para amanhã (+1 dia)"
              >
                <CalendarClock size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleComplete(rev.id)}
                disabled={isBusy}
                className="p-2 rounded-full bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors disabled:opacity-40"
                title="Marcar revisão como concluída"
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
