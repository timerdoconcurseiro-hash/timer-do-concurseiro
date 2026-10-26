"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Play, Trash2, Clock } from "lucide-react";
import type { EditalTopic, TopicStatus } from "@/app/actions";
import { TrafficLight, TRAFFIC_LIGHT_META } from "./TrafficLight";

export function formatTopicStudyTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

interface TopicRowProps {
  subjectId: string;
  subjectName: string;
  topic: EditalTopic;
  onStatusChange: (subjectId: string, topicId: string, nextStatus: TopicStatus) => void;
  onDelete: (subjectId: string, topicId: string) => void;
}

export const TopicRow = memo(function TopicRow({
  subjectId,
  subjectName,
  topic,
  onStatusChange,
  onDelete,
}: TopicRowProps) {
  const timeLabel = formatTopicStudyTime(topic.studied_seconds);
  const nextStatus = (TRAFFIC_LIGHT_META[topic.status] || TRAFFIC_LIGHT_META.none).next;

  return (
    <div
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
      className="flex items-center justify-between gap-2 p-2.5 hover:bg-slate-800/50 rounded-lg group transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <TrafficLight
          status={topic.status}
          onChange={(next) => onStatusChange(subjectId, topic.id, next)}
        />

        <button
          type="button"
          onClick={() => onStatusChange(subjectId, topic.id, nextStatus)}
          className="flex-1 text-left min-w-0"
          title="Clique para avançar a cor do semáforo"
        >
          <span
            className={`text-sm break-words transition-colors ${
              topic.status === "green"
                ? "text-emerald-200/80"
                : topic.status === "yellow"
                ? "text-amber-100"
                : topic.status === "red"
                ? "text-red-200"
                : "text-slate-300"
            }`}
          >
            {topic.name}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {timeLabel && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-medium text-cyan-300"
            title="Tempo líquido estudado neste tópico"
          >
            <Clock size={11} />
            {timeLabel}
          </span>
        )}

        <Link
          href={`/timer?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topic.name)}&topicId=${topic.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors"
          title="Estudar este tópico no Timer"
        >
          <Play size={12} />
          <span className="hidden md:inline">Estudar</span>
        </Link>

        <button
          type="button"
          onClick={() => onDelete(subjectId, topic.id)}
          className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          title="Remover tópico"
          aria-label="Remover tópico"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});
