"use client";

import React, { useState, useEffect } from "react";

const INTENSITY_COLORS = [
  "bg-slate-800/50 text-slate-500", // 0 (Zero)
  "bg-indigo-900/40 text-indigo-200 border border-indigo-800/50", // 1 (Leve)
  "bg-indigo-700/60 text-indigo-100 border border-indigo-500/50", // 2 (Médio)
  "bg-indigo-500 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.5)]", // 3 (Intenso)
  "bg-amber-400 text-slate-900 font-bold shadow-[0_0_15px_rgba(251,191,36,0.6)]", // 4 (Extremo)
];

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function ConsistencyHeatmap() {
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<{ day: number; month: number; year: number; monthName: string }>({
    day: 1, month: 0, year: 2026, monthName: ""
  });

  useEffect(() => {
    const now = new Date();
    const cYear = now.getFullYear();
    const cMonth = now.getMonth();
    const cDay = now.getDate();

    setCurrentDate({
      day: cDay,
      month: cMonth,
      year: cYear,
      monthName: MONTHS[cMonth]
    });

    const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(cYear, cMonth, 1).getDay();

    const blanks = Array.from({ length: firstDayOfWeek }).map(() => null);
    
    // Gerando mock de estudo para o mês atual
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNumber = i + 1;
      
      // Se for um dia futuro, intensidade = 0 (ainda não estudou)
      if (dayNumber > cDay) return { day: dayNumber, intensity: 0, isFuture: true };

      // Se for passado ou hoje, gera uma intensidade mockada
      const rand = Math.random();
      let intensity = 0; 
      if (rand > 0.3 && rand < 0.6) intensity = 1; 
      else if (rand >= 0.6 && rand < 0.8) intensity = 2; 
      else if (rand >= 0.8 && rand < 0.95) intensity = 3; 
      else if (rand >= 0.95) intensity = 4; 
      
      return { day: dayNumber, intensity, isFuture: false };
    });

    setCalendarData([...blanks, ...days]);
  }, []);

  if (calendarData.length === 0) return null; // loading state avoiding hydration mismatch

  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <h4 className="text-lg font-semibold text-white tracking-wide">
          {currentDate.monthName} <span className="text-slate-500 font-normal">{currentDate.year}</span>
        </h4>
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
        {calendarData.map((item, index) => {
          if (!item) {
            return <div key={index} className="aspect-square rounded-lg opacity-0" />;
          }
          
          const isToday = item.day === currentDate.day;
          // Estilo extra para destacar o dia de hoje
          const todayStyles = isToday ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900 z-10 scale-105" : "";

          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all duration-300 cursor-pointer 
                ${!item.isFuture ? 'hover:scale-110' : 'opacity-40 cursor-not-allowed'} 
                ${INTENSITY_COLORS[item.intensity]} 
                ${todayStyles}`}
              title={isToday ? "HOJE" : item.intensity > 0 ? `Dia ${item.day}: Nível de Foco ${item.intensity}` : `Dia ${item.day}`}
            >
              {item.day}
            </div>
          );
        })}
      </div>
      
      {/* Legenda Discreta e Explicativa */}
      <div className="flex justify-center items-center gap-4 mt-6 text-[10px] text-slate-400 bg-slate-900/40 py-2 px-4 rounded-lg w-fit mx-auto border border-slate-800">
        <div className="flex items-center gap-1.5" title="Não estudou">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/50 border border-slate-700" /> <span>Zero</span>
        </div>
        <div className="flex items-center gap-1.5" title="Menos de 2h">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-900/40 border border-indigo-800/50" /> <span>Leve</span>
        </div>
        <div className="flex items-center gap-1.5" title="Entre 2h e 4h">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" /> <span className="text-indigo-200">Intenso</span>
        </div>
        <div className="flex items-center gap-1.5" title="Mais de 4h">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]" /> <span className="text-amber-400 font-bold">Extremo</span>
        </div>
      </div>
    </div>
  );
}
