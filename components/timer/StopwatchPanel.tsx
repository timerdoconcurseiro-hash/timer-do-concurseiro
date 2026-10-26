"use client";

import { useEffect, useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatHms } from "@/lib/timer-engine/engine";
import {
  loadStopwatchContext,
  saveStopwatchContext,
} from "@/lib/timer-engine/session-context";
import type { StudySession } from "@/lib/storage/sessions";
import { playAlert, unlockAudio, type SoundOption } from "@/lib/sounds/beep";
import { SUBJECT_GROUPS } from "./PomodoroPanel";

interface StopwatchPanelProps {
  soundOption: SoundOption;
  isActiveTab?: boolean;
  onSessionSaved: (session: Omit<StudySession, "id">) => void;
}

export function StopwatchPanel({
  soundOption,
  isActiveTab = false,
  onSessionSaved,
}: StopwatchPanelProps) {
  const [ctx, setCtx] = useState(() => loadStopwatchContext());
  const { subjectCategory, customSubject, complement, topicId } = ctx;

  useEffect(() => {
    saveStopwatchContext(ctx);
  }, [ctx]);

  const { runtime, elapsedMs, start, pause, reset } =
    useTimerEngine("timer:stopwatch");

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  function handleStart() {
    unlockAudio();
    start();
  }

  function handleSave() {
    if (elapsedSeconds <= 0) return;
    if (runtime.running) pause();

    playAlert(soundOption, 2500);

    const now = new Date();

    let finalSubject = subjectCategory === "outra" ? customSubject.trim() : subjectCategory;
    if (!finalSubject) finalSubject = "Sem matéria definida";

    const fullSubject = complement.trim() ? `${finalSubject} (${complement.trim()})` : finalSubject;

    onSessionSaved({
      subject: fullSubject,
      mode: "stopwatch",
      netSeconds: elapsedSeconds,
      startedAt: new Date(now.getTime() - elapsedSeconds * 1000).toISOString(),
      endedAt: now.toISOString(),
      topicId: topicId || null,
    });

    reset();
    setCtx({ subjectCategory: "", customSubject: "", complement: "", topicId: "" });
  }

  // Atalho de teclado: Espaço inicia/pausa quando na aba Cronômetro
  useEffect(() => {
    if (!isActiveTab) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      e.preventDefault();
      if (runtime.running) {
        pause();
      } else {
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveTab, runtime.running]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex h-56 w-56 items-center justify-center rounded-full border-4 font-display text-4xl tabular-nums transition ${
          runtime.running
            ? "border-accent shadow-[0_0_40px_rgba(56,189,248,0.28)]"
            : "border-app-border"
        }`}
      >
        {formatHms(elapsedSeconds)}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <select
          value={subjectCategory}
          onChange={(e) => setCtx((prev) => ({ ...prev, subjectCategory: e.target.value }))}
          className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent appearance-none"
        >
          <option value="">Selecione a Disciplina...</option>
          {SUBJECT_GROUPS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="outra">Outra...</option>
        </select>

        {subjectCategory === "outra" && (
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCtx((prev) => ({ ...prev, customSubject: e.target.value }))}
            placeholder="Digite a disciplina manualmente"
            className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        )}

        <input
          type="text"
          value={complement}
          onChange={(e) => setCtx((prev) => ({ ...prev, complement: e.target.value }))}
          placeholder="Complemento / Tópico (ex: Atos Administrativos)"
          className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-3 mt-2">
        {!runtime.running ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-2xl bg-gradient-to-r from-action-start to-action-end px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90"
          >
            {elapsedSeconds > 0 ? "Retomar" : "Iniciar"}
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
          disabled={elapsedSeconds <= 0}
          className="rounded-2xl border border-accent px-6 py-2.5 font-medium text-accent transition hover:bg-accent/10 disabled:opacity-40"
        >
          Salvar
        </button>
        {elapsedSeconds > 0 && !runtime.running && (
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl border border-app-border px-6 py-2.5 font-medium text-text-secondary transition hover:border-danger hover:text-danger"
          >
            Zerar
          </button>
        )}
      </div>

      <p className="max-w-sm text-center text-xs text-text-secondary">
        Clique em <span className="text-text-primary">Salvar</span> ao finalizar para registrar o tempo no seu histórico.
      </p>
    </div>
  );
}
