"use client";

import { useEffect, useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatMmSs } from "@/lib/timer-engine/engine";
import { playAlert, unlockAudio, type SoundOption } from "@/lib/sounds/beep";
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

const SUBJECTS = [
  {
    group: "1. Conhecimentos Básicos",
    options: ["Língua Portuguesa", "Raciocínio Lógico-Matemático (RLM)", "Informática / TI", "Matemática", "Estatística"]
  },
  {
    group: "2. Eixo Jurídico Fundamental",
    options: ["Direito Constitucional", "Direito Administrativo"]
  },
  {
    group: "3. Eixo Criminal",
    options: ["Direito Penal", "Direito Processual Penal", "Legislação Penal Especial", "Criminologia", "Medicina Legal"]
  },
  {
    group: "4. Eixo Cível, Empresarial e Difusos",
    options: ["Direito Civil", "Direito Processual Civil", "Direito Empresarial", "Direito do Consumidor", "Estatuto da Criança e do Adolescente (ECA)", "Direitos Humanos", "Direito Ambiental", "Direito Internacional", "Ética Profissional"]
  },
  {
    group: "5. Eixo Fiscal, Controle e Gestão",
    options: ["Direito Tributário", "Contabilidade Geral", "Contabilidade Pública", "Auditoria", "Administração Financeira e Orçamentária (AFO)", "Administração Geral e Pública", "Economia", "Legislação Aduaneira", "Comércio Internacional"]
  },
  {
    group: "6. Eixo Trabalhista e Eleitoral",
    options: ["Direito do Trabalho", "Direito Processual do Trabalho", "Direito Eleitoral"]
  },
  {
    group: "7. Específicas Policiais",
    options: ["Legislação de Trânsito", "Física"]
  }
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
  
  // Novos campos de disciplina e complemento
  const [subjectCategory, setSubjectCategory] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [complement, setComplement] = useState("");
  
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
      let finalSubject = subjectCategory === "outra" ? customSubject.trim() : subjectCategory;
      if (!finalSubject) finalSubject = "Sem matéria definida";
      
      const fullSubject = complement.trim() ? `${finalSubject} (${complement.trim()})` : finalSubject;

      onSessionComplete({
        subject: fullSubject,
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
    unlockAudio(); // Desbloqueia o áudio na primeira interação do usuário
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
        {PRESETS.map((p) => {
          const isSelected = preset.label === p.label;
          let buttonClass = "";
          
          if (p.kind === "foco") {
            buttonClass = isSelected 
              ? "border-accent bg-accent/10 text-accent" 
              : "border-app-border text-text-secondary hover:border-accent-strong hover:text-accent-strong";
          } else {
            buttonClass = isSelected 
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
              : "border-app-border text-text-secondary hover:border-emerald-500 hover:text-emerald-500";
          }

          return (
            <button
              key={p.label}
              type="button"
              disabled={runtime.running}
              onClick={() => selectPreset(p)}
              className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40 ${buttonClass}`}
            >
              {p.label}
            </button>
          );
        })}
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
            ? preset.kind === "pausa" 
              ? "border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
              : "border-accent shadow-[0_0_40px_rgba(56,189,248,0.35)]"
            : "border-app-border"
        }`}
      >
        {formatMmSs(remainingSeconds)}
      </div>

      <p className="text-sm text-text-secondary">
        Modo atual: <span className={`font-medium ${preset.kind === "pausa" ? "text-emerald-400" : "text-text-primary"}`}>{preset.kind === "foco" ? "Foco" : "Pausa"}</span>
      </p>

      {/* Formulário de Disciplina e Complemento */}
      <div className="w-full max-w-sm space-y-3">
        <select
          value={subjectCategory}
          onChange={(e) => setSubjectCategory(e.target.value)}
          className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent appearance-none"
        >
          <option value="">Selecione a Disciplina...</option>
          {SUBJECTS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </optgroup>
          ))}
          <option value="outra">Outra...</option>
        </select>

        {subjectCategory === "outra" && (
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Digite a disciplina manualmente"
            className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        )}

        <input
          type="text"
          value={complement}
          onChange={(e) => setComplement(e.target.value)}
          placeholder="Complemento (ex: Atos Administrativos)"
          className="w-full rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-3 mt-2">
        {!runtime.running ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={isDone}
            className={`rounded-2xl px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90 disabled:opacity-40 ${
              preset.kind === "pausa" 
                ? "bg-emerald-500" 
                : "bg-gradient-to-r from-action-start to-action-end"
            }`}
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
