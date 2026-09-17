"use client";

import React from "react";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export function EditalProjection() {
  const daysRemaining = 90;
  const targetHours = 300;
  const currentHours = 85;
  const currentPace = 2.5; // hours/day
  
  const projectedTotal = currentHours + (daysRemaining * currentPace);
  const isOnTrack = projectedTotal >= targetHours;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-3xl font-light text-slate-100">{daysRemaining}</span>
          <span className="text-sm font-medium text-slate-500 mb-1">dias para a prova</span>
        </div>
        
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full rounded-full ${isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`} 
            style={{ width: `${Math.min((currentHours / targetHours) * 100, 100)}%` }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ritmo atual</span>
            <span className="text-slate-200 font-medium">{currentPace}h / dia</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Projeção final</span>
            <span className="text-slate-200 font-medium">{projectedTotal}h (Meta: {targetHours}h)</span>
          </div>
        </div>
      </div>

      <div className={`mt-6 p-3 rounded-lg border flex items-start gap-3 text-sm
        ${isOnTrack 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}
      >
        {isOnTrack ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
        <p>
          {isOnTrack 
            ? "Você está num ótimo ritmo! Se mantiver a constância, fechará o edital com folga para revisão."
            : "Atenção: no ritmo atual você não baterá a meta de horas até a prova. Tente aumentar 30 min diários."}
        </p>
      </div>
    </div>
  );
}
