"use client";

import React, { memo } from "react";
import type { TopicStatus } from "@/app/actions";

export const TRAFFIC_LIGHT_META: Record<
  TopicStatus,
  {
    label: string;
    shortLabel: string;
    dotClass: string;
    pillClass: string;
    next: TopicStatus;
  }
> = {
  none: {
    label: "Não iniciado",
    shortLabel: "Não iniciado",
    dotClass: "bg-slate-600 border-slate-400/50",
    pillClass: "border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500",
    next: "red",
  },
  red: {
    label: "Não domino",
    shortLabel: "Não domino",
    dotClass: "bg-red-500 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    pillClass: "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25",
    next: "yellow",
  },
  yellow: {
    label: "Preciso revisar",
    shortLabel: "Revisar",
    dotClass: "bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    pillClass: "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
    next: "green",
  },
  green: {
    label: "Domino",
    shortLabel: "Domino",
    dotClass: "bg-emerald-500 border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    pillClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
    next: "none",
  },
};

export const TRAFFIC_LIGHT_ORDER: TopicStatus[] = ["none", "red", "yellow", "green"];

interface TrafficLightProps {
  status: TopicStatus;
  onChange: (nextStatus: TopicStatus) => void;
  compact?: boolean;
}

export const TrafficLight = memo(function TrafficLight({
  status,
  onChange,
  compact = false,
}: TrafficLightProps) {
  const current = TRAFFIC_LIGHT_META[status] || TRAFFIC_LIGHT_META.none;

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0" role="group" aria-label="Semáforo de domínio">
      {TRAFFIC_LIGHT_ORDER.map((key) => {
        const meta = TRAFFIC_LIGHT_META[key];
        const active = status === key;
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (status !== key) onChange(key);
            }}
            title={meta.label}
            aria-label={meta.label}
            aria-pressed={active}
            className={`h-4 w-4 rounded-full border transition-transform ${meta.dotClass} ${
              active
                ? "scale-110 ring-2 ring-white/40 opacity-100"
                : "opacity-30 hover:opacity-75 hover:scale-105"
            }`}
          />
        );
      })}
      {!compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(current.next);
          }}
          title={`Clique para alternar (${current.label})`}
          className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${current.pillClass}`}
        >
          {current.shortLabel}
        </button>
      )}
    </div>
  );
});
