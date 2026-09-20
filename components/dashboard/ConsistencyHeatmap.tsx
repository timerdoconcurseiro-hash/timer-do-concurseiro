"use client";

import React, { useState, useEffect } from "react";
import { getHeatmapData } from "@/app/actions";

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
  const [selectedDayInfo, setSelectedDayInfo] = useState<any | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDayInfo) {
        setSelectedDayInfo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDayInfo]);

  useEffect(() => {
    const loadData = async () => {
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
      
      const rawSessions = await getHeatmapData();
      
      // Group sessions by day
      const sessionsByDay: Record<number, { totalSeconds: number; details: { subject: string, time: string }[] }> = {};
      
      rawSessions.forEach(session => {
        const sessionDate = new Date(session.finished_at);
        if (sessionDate.getFullYear() === cYear && sessionDate.getMonth() === cMonth) {
          const d = sessionDate.getDate();
          if (!sessionsByDay[d]) {
            sessionsByDay[d] = { totalSeconds: 0, details: [] };
          }
          sessionsByDay[d].totalSeconds += session.net_seconds;
          
          const hours = Math.floor(session.net_seconds / 3600);
          const mins = Math.floor((session.net_seconds % 3600) / 60);
          const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          
          sessionsByDay[d].details.push({ subject: session.subject, time: timeStr });
        }
      });

      const days = Array.from({ length: daysInMonth }).map((_, i) => {
        const dayNumber = i + 1;
        
        if (dayNumber > cDay) return { day: dayNumber, intensity: 0, isFuture: true, details: [] };

        const dayData = sessionsByDay[dayNumber];
        let intensity = 0;
        let details: any[] = [];

        if (dayData) {
          const hours = dayData.totalSeconds / 3600;
          if (hours > 0 && hours < 2) intensity = 1;
          else if (hours >= 2 && hours < 4) intensity = 2;
          else if (hours >= 4 && hours < 6) intensity = 3;
          else if (hours >= 6) intensity = 4;
          details = dayData.details;
        }
        
        return { day: dayNumber, intensity, isFuture: false, details };
      });

      setCalendarData([...blanks, ...days]);
    };
    
    loadData();
  }, []);

  if (calendarData.length === 0) return null;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto relative h-full py-4 overflow-y-auto">
      
      {/* MODAL DE DETALHES DO DIA */}
      {selectedDayInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedDayInfo(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedDayInfo(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-1">
              Dia {selectedDayInfo.day} de {currentDate.monthName}
            </h3>
            
            {selectedDayInfo.intensity === 0 ? (
              <p className="text-slate-400 mt-4 text-sm">Você não registrou estudos neste dia.</p>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">Sessões Concluídas</p>
                {selectedDayInfo.details.map((d: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-300 text-sm font-medium">{d.subject}</span>
                    <span className="text-emerald-400 text-sm font-bold">{d.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 px-2 shrink-0">
        <h4 className="text-lg font-semibold text-white tracking-wide">
          {currentDate.monthName} <span className="text-slate-500 font-normal">{currentDate.year}</span>
        </h4>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 shrink-0">
        {calendarData.map((item, index) => {
          if (!item) {
            return <div key={index} className="aspect-square rounded-lg opacity-0" />;
          }
          
          const isToday = item.day === currentDate.day;
          const todayStyles = isToday ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900 z-10 scale-105" : "";

          return (
            <div
              key={index}
              onClick={() => {
                if (!item.isFuture) setSelectedDayInfo(item);
              }}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all duration-300 cursor-pointer 
                ${!item.isFuture ? 'hover:scale-110' : 'opacity-40 cursor-not-allowed'} 
                ${INTENSITY_COLORS[item.intensity]} 
                ${todayStyles}`}
              title={isToday ? "HOJE (Clique para ver detalhes)" : item.intensity > 0 ? `Dia ${item.day}: Nível de Foco ${item.intensity}` : `Dia ${item.day}`}
            >
              {item.day}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center items-center gap-4 mt-6 text-[10px] text-slate-400 bg-slate-900/40 py-2 px-4 rounded-lg w-fit mx-auto border border-slate-800 shrink-0">
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
