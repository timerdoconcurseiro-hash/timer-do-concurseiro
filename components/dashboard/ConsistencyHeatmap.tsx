"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import { getHeatmapData } from "@/app/actions";
import { getSessions } from "@/lib/storage/sessions";

const INTENSITY_COLORS = [
  "bg-slate-800/50 text-slate-500", // 0 (Zero)
  "bg-indigo-900/40 text-indigo-200 border border-indigo-800/50", // 1 (Leve)
  "bg-indigo-700/60 text-indigo-100 border border-indigo-500/50", // 2 (Médio)
  "bg-indigo-500 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.5)]", // 3 (Intenso)
  "bg-amber-400 text-slate-900 font-bold shadow-[0_0_15px_rgba(251,191,36,0.6)]", // 4 (Extremo)
];

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type RawSession = {
  finished_at: string;
  net_seconds: number;
  subject: string;
};

type DayCell = {
  day: number;
  intensity: number;
  isFuture: boolean;
  totalSeconds: number;
  details: { subject: string; time: string }[];
};

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
}

export function ConsistencyHeatmap() {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth());
  const [allSessions, setAllSessions] = useState<RawSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayCell | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDayInfo) {
        setSelectedDayInfo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDayInfo]);

  // Carrega TODO o histórico (Supabase + sessões salvas localmente no navegador), incluindo meses/anos anteriores
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const remote = await getHeatmapData();
        const local = getSessions();

        // Mescla sessões remotas e locais evitando duplicatas pelo par (minuto de término + segundos + matéria)
        const seen = new Set<string>();
        const merged: RawSession[] = [];

        const pushUnique = (item: RawSession) => {
          if (!item.finished_at || !item.net_seconds || item.net_seconds <= 0) return;
          const d = new Date(item.finished_at);
          if (isNaN(d.getTime())) return;
          const minuteKey = d.toISOString().slice(0, 16);
          const sig = `${minuteKey}|${item.net_seconds}|${(item.subject || "").trim().toLowerCase()}`;
          if (seen.has(sig)) return;
          seen.add(sig);
          merged.push(item);
        };

        (remote || []).forEach((s: { finished_at: string; net_seconds: number; subject: string }) =>
          pushUnique({
            finished_at: s.finished_at,
            net_seconds: Number(s.net_seconds) || 0,
            subject: s.subject || "Estudo",
          })
        );

        (local || []).forEach((s) =>
          pushUnique({
            finished_at: s.endedAt || s.startedAt,
            net_seconds: Number(s.netSeconds) || 0,
            subject: s.subject || "Estudo",
          })
        );

        if (!cancelled) {
          setAllSessions(merged);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goPrevMonth = () => {
    setSelectedDayInfo(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedDayInfo(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setSelectedDayInfo(null);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Monta os dados do mês selecionado (atual ou meses passados)
  const { calendarData, monthTotalSeconds, activeDaysCount } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const blanks: (DayCell | null)[] = Array.from({ length: firstDayOfWeek }).map(() => null);

    const sessionsByDay: Record<
      number,
      { totalSeconds: number; bySubject: Record<string, number> }
    > = {};

    let monthSeconds = 0;

    allSessions.forEach((session) => {
      const d = new Date(session.finished_at);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const dayNum = d.getDate();
        if (!sessionsByDay[dayNum]) {
          sessionsByDay[dayNum] = { totalSeconds: 0, bySubject: {} };
        }
        sessionsByDay[dayNum].totalSeconds += session.net_seconds;
        const subj = session.subject || "Estudo";
        sessionsByDay[dayNum].bySubject[subj] =
          (sessionsByDay[dayNum].bySubject[subj] || 0) + session.net_seconds;
        monthSeconds += session.net_seconds;
      }
    });

    const days: DayCell[] = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNumber = i + 1;
      const cellDate = new Date(viewYear, viewMonth, dayNumber);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const isFuture = cellDate > todayEnd;

      const dayData = sessionsByDay[dayNumber];
      let intensity = 0;
      let details: { subject: string; time: string }[] = [];
      let totalSeconds = 0;

      if (dayData && !isFuture) {
        totalSeconds = dayData.totalSeconds;
        const hours = totalSeconds / 3600;
        if (hours > 0 && hours < 2) intensity = 1;
        else if (hours >= 2 && hours < 4) intensity = 2;
        else if (hours >= 4 && hours < 6) intensity = 3;
        else if (hours >= 6) intensity = 4;

        details = Object.entries(dayData.bySubject)
          .sort((a, b) => b[1] - a[1])
          .map(([subject, secs]) => ({
            subject,
            time: formatDuration(secs),
          }));
      }

      return { day: dayNumber, intensity, isFuture, totalSeconds, details };
    });

    return {
      calendarData: [...blanks, ...days],
      monthTotalSeconds: monthSeconds,
      activeDaysCount: Object.keys(sessionsByDay).length,
    };
  }, [allSessions, viewYear, viewMonth, now]);

  const monthHoursStr = (monthTotalSeconds / 3600).toFixed(1);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto relative h-full py-1">
      {/* MODAL DE DETALHES DO DIA (via Portal para não ficar preso no card) */}
      {mounted &&
        selectedDayInfo &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedDayInfo(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedDayInfo(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition p-1"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold text-white">
                Dia {selectedDayInfo.day} de {MONTHS[viewMonth]} de {viewYear}
              </h3>

              {selectedDayInfo.intensity === 0 ? (
                <p className="text-slate-400 mt-4 text-sm">
                  Nenhum estudo registrado neste dia.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    <span>Matérias Estudadas</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Total: {formatDuration(selectedDayInfo.totalSeconds)}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedDayInfo.details.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 gap-2"
                      >
                        <span className="text-slate-200 text-xs font-medium break-words">
                          {d.subject}
                        </span>
                        <span className="text-emerald-400 text-xs font-bold shrink-0">
                          {d.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Navegação entre meses (permite consultar meses passados) */}
      <div className="flex justify-between items-center mb-3 px-1 shrink-0 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrevMonth}
            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide min-w-[135px] text-center">
            {MONTHS[viewMonth]} <span className="text-slate-500 font-normal">{viewYear}</span>
          </h4>
          <button
            type="button"
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="ml-1 px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider"
            >
              Atual
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 text-right">
          <span className="text-emerald-400 font-bold">{monthHoursStr}h</span> •{" "}
          <span>{activeDaysCount}d ativos</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5 shrink-0">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {loading && allSessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-8">
          Carregando histórico de consistência...
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5 shrink-0">
          {calendarData.map((item, index) => {
            if (!item) {
              return <div key={index} className="aspect-square rounded-lg opacity-0" />;
            }

            const isToday = isCurrentMonth && item.day === now.getDate();
            const todayStyles = isToday
              ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-900 z-10"
              : "";

            return (
              <button
                type="button"
                key={index}
                disabled={item.isFuture}
                onClick={() => {
                  if (!item.isFuture) setSelectedDayInfo(item);
                }}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-all duration-200 ${
                  !item.isFuture
                    ? "hover:scale-105 cursor-pointer"
                    : "opacity-35 cursor-not-allowed"
                } ${INTENSITY_COLORS[item.intensity]} ${todayStyles}`}
                title={
                  isToday
                    ? "HOJE (Clique para ver detalhes)"
                    : item.intensity > 0
                      ? `Dia ${item.day}: ${formatDuration(item.totalSeconds)}`
                      : `Dia ${item.day}`
                }
              >
                {item.day}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-center items-center gap-3 mt-4 text-[10px] text-slate-400 bg-slate-900/40 py-1.5 px-3 rounded-lg w-fit mx-auto border border-slate-800 shrink-0">
        <div className="flex items-center gap-1" title="Não estudou">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/50 border border-slate-700" />{" "}
          <span>Zero</span>
        </div>
        <div className="flex items-center gap-1" title="Menos de 2h">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-900/40 border border-indigo-800/50" />{" "}
          <span>Leve</span>
        </div>
        <div className="flex items-center gap-1" title="Entre 2h e 4h">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />{" "}
          <span className="text-indigo-200">Intenso</span>
        </div>
        <div className="flex items-center gap-1" title="Mais de 6h">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />{" "}
          <span className="text-amber-400 font-bold">Extremo</span>
        </div>
      </div>
    </div>
  );
}
