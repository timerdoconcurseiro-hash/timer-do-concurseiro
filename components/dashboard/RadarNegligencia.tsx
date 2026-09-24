"use client";

import React, { useEffect, useState } from "react";
import { Radar, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface SessionInfo {
  subject: string;
  lastStudied: Date;
}

export function RadarNegligencia() {
  const [subjectData, setSubjectData] = useState<{ subject: string; daysAgo: number; status: 'green' | 'yellow' | 'red' }[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('timer_sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        
        const latestBySubject: Record<string, Date> = {};
        
        sessions.forEach((s: any) => {
          if (s.subject && s.subject !== "Sem matéria definida") {
            const date = new Date(s.timestamp || s.startedAt || Date.now());
            if (!latestBySubject[s.subject] || date > latestBySubject[s.subject]) {
              latestBySubject[s.subject] = date;
            }
          }
        });

        const now = new Date();
        const data = Object.entries(latestBySubject).map(([subject, date]) => {
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          let status: 'green' | 'yellow' | 'red' = 'red';
          if (daysAgo <= 3) status = 'green';
          else if (daysAgo <= 7) status = 'yellow';

          return { subject, daysAgo, status };
        });

        // Sort: Red first, then Yellow, then Green, then by days descending
        data.sort((a, b) => {
          const statusVal = { red: 3, yellow: 2, green: 1 };
          if (statusVal[a.status] !== statusVal[b.status]) {
            return statusVal[b.status] - statusVal[a.status];
          }
          return b.daysAgo - a.daysAgo;
        });

        setSubjectData(data);
      }
    } catch {
      // Ignore
    }
  }, []);

  if (subjectData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Radar size={40} className="text-amber-400 mb-4 opacity-50" />
        <h4 className="text-slate-200 font-medium mb-2">Sem Dados</h4>
        <p className="text-slate-400 text-sm">
          O radar precisa de sessões de estudo salvas no Timer para funcionar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subjectData.map((item, index) => (
        <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
          {item.status === 'green' && (
            <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          )}
          {item.status === 'yellow' && (
            <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-400">
              <Info size={18} />
            </div>
          )}
          {item.status === 'red' && (
            <div className="bg-red-500/20 p-2 rounded-full text-red-400">
              <AlertTriangle size={18} />
            </div>
          )}

          <div className="flex-1">
            <h4 className="font-bold text-slate-200">{item.subject}</h4>
            <p className="text-sm text-slate-400">
              {item.status === 'green' && `Revisado há ${item.daysAgo === 0 ? 'hoje' : item.daysAgo + ' dia(s)'}`}
              {item.status === 'yellow' && `Atenção, ${item.daysAgo} dias sem revisão`}
              {item.status === 'red' && `Negligenciada há ${item.daysAgo} dias!`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
