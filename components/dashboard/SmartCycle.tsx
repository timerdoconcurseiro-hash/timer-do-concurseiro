"use client";

import React from "react";
import { ArrowRight, BookOpen, Clock, Target } from "lucide-react";

const SUGGESTED_CYCLE = [
  { subject: "Direito Constitucional", reason: "Alto peso • 3 dias sem revisar", duration: "50 min" },
  { subject: "Informática", reason: "Revisão espaçada (24h)", duration: "25 min" },
  { subject: "Português", reason: "Meta semanal não atingida", duration: "50 min" },
];

export function SmartCycle() {
  return (
    <div className="space-y-4">
      {SUGGESTED_CYCLE.map((item, index) => (
        <div 
          key={index} 
          className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0 text-cyan-400 bg-cyan-400/10 p-2 rounded-full">
              <BookOpen size={16} />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">{item.subject}</h4>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Target size={12} /> {item.reason}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-bold px-2 py-1 bg-slate-800 text-slate-300 rounded-md flex items-center gap-1">
              <Clock size={12} /> {item.duration}
            </span>
            {index === 0 && (
              <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                Iniciar <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
      
      <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors text-sm font-medium">
        Configurar pesos das matérias
      </button>
    </div>
  );
}
