"use client";

import { useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatHms } from "@/lib/timer-engine/engine";
import type { StudySession } from "@/lib/storage/sessions";

interface StopwatchPanelProps {
  onSessionSaved: (session: Omit<StudySession, "id">) => void;
}

export function StopwatchPanel({ onSessionSaved }: StopwatchPanelProps) {
  const [subject, setSubject] = useState("");
  const { runtime, elapsedMs, start, pause, reset } =
    useTimerEngine("timer:stopwatch");

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  function handleSave() {
    if (elapsedSeconds <= 0) return;
    if (runtime.running) pause();

    const now = new Date();
    onSessionSaved({
      subject: subject.trim() || "Sem matéria definida",
      mode: "stopwatch",
      netSeconds: elapsedSeconds,
      startedAt: new Date(now.getTime() - elapsedSeconds * 1000).toISOString(),
      endedAt: now.toISOString(),
    });
    reset();
    setSubject("");
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-56 w-56 items-center justify-center rounded-full border-4 border-app-border font-display text-4xl tabular-nums">
        {formatHms(elapsedSeconds)}
      </div>

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Qual matéria você vai estudar?"
        className="w-full max-w-sm rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />

      <div className="flex gap-3">
        {!runtime.running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-2xl bg-gradient-to-r from-action-start to-action-end px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90"
          >
            Iniciar
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="rounded-2xl border border-app-border px-6 py-2.5 font-medium text-text-primary transition hover:border-accent"
          >
            Pausar
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="rounded-2xl border border-accent px-6 py-2.5 font-medium text-accent transition hover:bg-accent/10"
        >
          Salvar
        </button>
      </div>

      <p className="max-w-sm text-center text-xs text-text-secondary">
        Clique em <span className="text-text-primary">Salvar</span> ao
        finalizar para registrar o tempo no seu histórico.
      </p>
    </div>
  );
}
