"use client";

import React, { useEffect, useState } from "react";
import { Radar, AlertTriangle, Info, CheckCircle2, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { getSessions } from "@/lib/storage/sessions";
import type { RadarItem } from "@/app/actions";

function baseSubject(value: string) {
  const idx = (value || "").indexOf(" (");
  return (idx > 0 ? value.slice(0, idx) : value || "").trim();
}

export function RadarNegligencia({ initialData }: { initialData?: RadarItem[] }) {
  const [items, setItems] = useState<RadarItem[]>(initialData || []);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setItems(initialData);
      return;
    }

    // Fallback: usa as sessões salvas localmente no navegador ("tc:sessions")
    try {
      const localSessions = getSessions();
      if (!localSessions || localSessions.length === 0) return;

      const bySubject: Record<string, { lastDate: Date; totalSeconds: number }> = {};

      localSessions.forEach((s) => {
        const subj = baseSubject(s.subject);
        if (!subj || subj.toLowerCase() === "sem matéria definida") return;
        const d = new Date(s.endedAt || s.startedAt || Date.now());
        if (!bySubject[subj]) {
          bySubject[subj] = { lastDate: d, totalSeconds: 0 };
        }
        if (d > bySubject[subj].lastDate) {
          bySubject[subj].lastDate = d;
        }
        bySubject[subj].totalSeconds += s.netSeconds || 0;
      });

      const now = new Date();
      const computed: RadarItem[] = Object.entries(bySubject).map(([subject, info]) => {
        const diffTime = Math.max(0, now.getTime() - info.lastDate.getTime());
        const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const status: RadarItem["status"] =
          daysAgo <= 3 ? "green" : daysAgo <= 7 ? "yellow" : "red";
        return {
          subject,
          daysAgo,
          totalHours: Number((info.totalSeconds / 3600).toFixed(1)),
          status,
        };
      });

      const weight = { never: 4, red: 3, yellow: 2, green: 1 };
      computed.sort((a, b) => {
        if (weight[a.status] !== weight[b.status]) return weight[b.status] - weight[a.status];
        return (b.daysAgo ?? 0) - (a.daysAgo ?? 0);
      });

      setItems(computed);
    } catch {
      // ignore
    }
  }, [initialData]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Radar size={40} className="text-amber-400 mb-4 opacity-50" />
        <h4 className="text-slate-200 font-medium mb-2">Sem Dados no Radar</h4>
        <p className="text-slate-400 text-sm">
          Cadastre seu Edital ou conclua sessões no Timer para monitorar matérias esquecidas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3.5 flex items-center gap-3 hover:border-slate-600 transition-colors"
        >
          {item.status === "green" && (
            <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          {item.status === "yellow" && (
            <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-400 shrink-0">
              <Info size={18} />
            </div>
          )}
          {(item.status === "red" || item.status === "never") && (
            <div className="bg-red-500/20 p-2 rounded-full text-red-400 shrink-0">
              <AlertTriangle size={18} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-slate-200 truncate">{item.subject}</h4>
            <p className="text-xs text-slate-400">
              {item.status === "never" && "Nunca estudada no Timer!"}
              {item.status === "green" &&
                `Estudada ${item.daysAgo === 0 ? "hoje" : `há ${item.daysAgo} dia(s)`}`}
              {item.status === "yellow" && `Atenção: ${item.daysAgo} dias sem revisão`}
              {item.status === "red" && `Negligenciada há ${item.daysAgo} dias!`}
              {item.totalHours > 0 && ` • ${item.totalHours}h`}
            </p>
          </div>

          <Link
            href={`/timer?subject=${encodeURIComponent(item.subject)}`}
            className="p-2 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition-colors shrink-0"
            title={`Estudar ${item.subject} agora`}
          >
            <Play size={14} className="ml-0.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
