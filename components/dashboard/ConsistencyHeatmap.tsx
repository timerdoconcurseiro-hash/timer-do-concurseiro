"use client";

import React from "react";

// Helper para gerar um calendário mockado do mês atual
function generateMonthData() {
  const daysInMonth = 30; // Simulando setembro de 2026 para simplificar
  const firstDayOfWeek = 2; // Começa numa terça-feira

  const blanks = Array.from({ length: firstDayOfWeek }).map(() => null);
  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const rand = Math.random();
    let intensity = 0; // 0 = sem estudo
    if (rand > 0.4 && rand < 0.7) intensity = 1; // Leve
    else if (rand >= 0.7 && rand < 0.85) intensity = 2; // Médio
    else if (rand >= 0.85 && rand < 0.95) intensity = 3; // Intenso
    else if (rand >= 0.95) intensity = 4; // Máximo
    
    return { day: i + 1, intensity };
  });

  return [...blanks, ...days];
}

const MONTH_DATA = generateMonthData();
const INTENSITY_COLORS = [
  "bg-slate-800/50 text-slate-500", // 0
  "bg-indigo-900/40 text-indigo-200 border border-indigo-800/50", // 1
  "bg-indigo-700/60 text-indigo-100 border border-indigo-500/50", // 2
  "bg-indigo-500 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.5)]", // 3
  "bg-amber-400 text-slate-900 font-bold shadow-[0_0_15px_rgba(251,191,36,0.6)]", // 4
];

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

export function ConsistencyHeatmap() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <h4 className="text-lg font-semibold text-white tracking-wide">Setembro <span className="text-slate-500 font-normal">2026</span></h4>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do Calendário */}
      <div className="grid grid-cols-7 gap-2">
        {MONTH_DATA.map((item, index) => {
          if (!item) {
            return <div key={index} className="aspect-square rounded-lg opacity-0" />;
          }
          
          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all duration-300 hover:scale-110 cursor-pointer ${INTENSITY_COLORS[item.intensity]}`}
              title={item.intensity > 0 ? `Dia ${item.day}: Nível de Foco ${item.intensity}` : `Dia ${item.day}: Nenhum estudo registrado`}
            >
              {item.day}
            </div>
          );
        })}
      </div>
      
      {/* Legenda */}
      <div className="flex justify-center items-center gap-3 mt-6 text-xs text-slate-400 bg-slate-900/50 py-2 px-4 rounded-full w-fit mx-auto border border-slate-800">
        <span className="font-medium">Legenda:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-slate-800/50" /> <span>Zero</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-700/60" /> <span>Foco</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" /> <span className="text-amber-400 font-medium">Extremo</span>
        </div>
      </div>
    </div>
  );
}
