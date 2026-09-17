"use client";

import { useEffect, useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatMmSs } from "@/lib/timer-engine/engine";
import { playAlert, type SoundOption } from "@/lib/sounds/beep";
import type { StudySession } from "@/lib/storage/sessions";

interface Preset {
  label: string;
  minutes: number;
  kind: "foco" | "pausa";
}

const PRESETS: Preset[] = [
  { label: "25 min Foco", minutes: 25, kind: "foco" },
  { label: "30 min Foco", minutes: 30, kind: "foco" },
  { label: "50 min Foco", minutes: 50, kind: "foco" },
  { label: "60 min Foco", minutes: 60, kind: "foco" },
  { label: "5 min Pausa", minutes: 5, kind: "pausa" },
  { label: "10 min Pausa", minutes: 10, kind: "pausa" },
  { label: "15 min Pausa", minutes: 15, kind: "pausa" },
  { label: "30 min Pausa", minutes: 30, kind: "pausa" },
];

const PRESET_STORAGE_KEY = "timer:pomodoro:preset";

function loadPreset(): Preset {
  if (typeof window === "undefined") return PRESETS[0];
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return PRESETS[0];
    const parsed = JSON.parse(raw) as Preset;
    if (typeof parsed.minutes === "number" && parsed.minutes > 0) return parsed;
    return PRESETS[0];
  } catch {
    return PRESETS[0];
  }
}

function savePreset(preset: Preset) {
  window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(preset));
}

interface PomodoroPanelProps {
  soundOption: SoundOption;
  onSessionComplete: (session: Omit<StudySession, "id">) => void;
}

export function PomodoroPanel({
  soundOption,
  onSessionComplete,
}: PomodoroPanelProps) {
  const [preset, setPreset] = useState<Preset>(() => loadPreset());
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [subject, setSubject] = useState("");
  const [notifiedForRun, setNotifiedForRun] = useState(false);

  const { runtime, elapsedMs, start, pause, reset } =
    useTimerEngine("timer:pomodoro");

  const durationMs = preset.minutes * 60 * 1000;
  const remainingSeconds = Math.max(
    0,
    Math.round((durationMs - elapsedMs) / 1000),
  );
  const isDone = elapsedMs >= durationMs;

  useEffect(() => {
    if (isDone && runtime.running) pause();
  }, [isDone, runtime.running, pause]);

  useEffect(() => {
    if (!isDone || notifiedForRun) return;
    setNotifiedForRun(true);
    playAlert(soundOption);

    if (
      document.hidden &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Timer do Concurseiro", {
        body:
          preset.kind === "foco"
            ? "Foco concluído! Hora da pausa."
            : "Pausa concluída! Hora de voltar ao foco.",
      });
    }

    if (preset.kind === "foco") {
      const now = new Date();
      onSessionComplete({
        subject: subject.trim() || "Sem matéria definida",
        mode: "pomodoro",
        netSeconds: preset.minutes * 60,
        startedAt: new Date(now.getTime() - preset.minutes * 60000).toISOString(),
        endedAt: now.toISOString(),
      });
    }

    // Zera o acumulado após o ciclo natural terminar — evita que o tempo
    // decorrido "vaze" para o próximo bloco (ou para depois de um reload).
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, notifiedForRun]);

  function selectPreset(next: Preset) {
    if (runtime.running) return;
    reset();
    savePreset(next);
    setNotifiedForRun(false);
    setPreset(next);
  }

  function applyCustom() {
    const value = Number(customMinutes);
    if (!Number.isFinite(value) || value <= 0) return;
    selectPreset({ label: `${value} min personalizado`, minutes: value, kind: preset.kind });
    setCustomMinutes("");
    setShowCustom(false);
  }

  function handleStart() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setNotifiedForRun(false);
    start();
  }

  function handleZerar() {
    reset();
    setNotifiedForRun(false);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={runtime.running}
            onClick={() => selectPreset(p)}
            className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40 ${
              preset.label === p.label
                ? "border-accent bg-accent/10 text-accent"
                : "border-app-border text-text-secondary hover:border-accent-strong"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          disabled={runtime.running}
          onClick={() => setShowCustom((v) => !v)}
          className="rounded-full border border-app-border px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-strong disabled:opacity-40"
        >
          Ajustar
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="minutos"
            className="w-28 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-app-bg"
          >
            OK
          </button>
        </div>
      )}

      <div
        className={`flex h-56 w-56 items-center justify-center rounded-full border-4 font-display text-5xl tabular-nums transition ${
          runtime.running
            ? "border-accent shadow-[0_0_40px_rgba(56,189,248,0.35)]"
            : "border-app-border"
        }`}
      >
        {formatMmSs(remainingSeconds)}
      </div>

      <p className="text-sm text-text-secondary">
        Modo atual: <span className="text-text-primary">{preset.kind === "foco" ? "Foco" : "Pausa"}</span>
      </p>

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
            onClick={handleStart}
            disabled={isDone}
            className="rounded-2xl bg-gradient-to-r from-action-start to-action-end px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90 disabled:opacity-40"
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
          onClick={handleZerar}
          className="rounded-2xl border border-app-border px-6 py-2.5 font-medium text-text-secondary transition hover:border-danger hover:text-danger"
        >
          Zerar
        </button>
      </div>
    </div>
  );
}
