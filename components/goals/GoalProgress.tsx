"use client";

import { useState } from "react";
import { formatHms } from "@/lib/timer-engine/engine";

function formatGoalLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}min`;
}

interface GoalProgressProps {
  netSecondsToday: number;
  goalMinutes: number;
  streakDays: number;
  onChangeGoal: (minutes: number) => void;
}

export function GoalProgress({
  netSecondsToday,
  goalMinutes,
  streakDays,
  onChangeGoal,
}: GoalProgressProps) {
  const goalSeconds = goalMinutes * 60;
  const pct = Math.min(100, Math.round((netSecondsToday / goalSeconds) * 100));

  const [isEditing, setIsEditing] = useState(false);
  const [tempHours, setTempHours] = useState(String(goalMinutes / 60));

  const handleSave = () => {
    const hours = parseFloat(tempHours);
    if (!isNaN(hours) && hours > 0) {
      onChangeGoal(Math.round(hours * 60));
    }
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-secondary flex items-center gap-2">
          Meta: {formatHms(netSecondsToday)} de{" "}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={tempHours}
                onChange={(e) => setTempHours(e.target.value)}
                className="w-16 bg-slate-800 text-white rounded px-1 outline-none text-center"
                autoFocus
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <span>h</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempHours(String(goalMinutes / 60));
                setIsEditing(true);
              }}
              className="underline decoration-dotted underline-offset-2 hover:text-accent flex items-center gap-1"
            >
              {formatGoalLabel(goalMinutes)} ✏️
            </button>
          )}
        </span>
        <span className="flex items-center gap-1 text-orange-400">
          🔥 {streakDays} {streakDays === 1 ? "dia" : "dias"} na meta
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-app-bg">
        <div
          className="h-full rounded-full bg-gradient-to-r from-action-start to-action-end transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-text-secondary">{pct}%</p>
    </div>
  );
}
