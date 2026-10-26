"use client";

import { useEffect, useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatMmSs } from "@/lib/timer-engine/engine";
import {
  loadPomodoroContext,
  savePomodoroContext,
  type PomodoroPreset,
} from "@/lib/timer-engine/session-context";
import { playAlert, unlockAudio, stopAlert, type SoundOption } from "@/lib/sounds/beep";
import type { StudySession } from "@/lib/storage/sessions";
import { useSearchParams } from "next/navigation";

const PRESETS: PomodoroPreset[] = [
  { label: "25 min Foco", minutes: 25, kind: "foco" },
  { label: "30 min Foco", minutes: 30, kind: "foco" },
  { label: "50 min Foco", minutes: 50, kind: "foco" },
  { label: "60 min Foco", minutes: 60, kind: "foco" },
  { label: "5 min Pausa", minutes: 5, kind: "pausa" },
  { label: "10 min Pausa", minutes: 10, kind: "pausa" },
  { label: "15 min Pausa", minutes: 15, kind: "pausa" },
  { label: "30 min Pausa", minutes: 30, kind: "pausa" },
];

export const SUBJECT_GROUPS = [
  {
    group: "1. Conhecimentos Básicos",
    options: [
      "Língua Portuguesa",
      "Raciocínio Lógico-Matemático (RLM)",
      "Informática / TI",
      "Matemática",
      "Estatística",
    ],
  },
  {
    group: "2. Eixo Jurídico Fundamental",
    options: ["Direito Constitucional", "Direito Administrativo"],
  },
  {
    group: "3. Eixo Criminal",
    options: [
      "Direito Penal",
      "Direito Processual Penal",
      "Legislação Penal Especial",
      "Criminologia",
      "Medicina Legal",
    ],
  },
  {
    group: "4. Eixo Cível, Empresarial e Difusos",
    options: [
      "Direito Civil",
      "Direito Processual Civil",
      "Direito Empresarial",
      "Direito do Consumidor",
      "Estatuto da Criança e do Adolescente (ECA)",
      "Direitos Humanos",
      "Direito Ambiental",
      "Direito Internacional",
      "Ética Profissional",
    ],
  },
  {
    group: "5. Eixo Fiscal, Controle e Gestão",
    options: [
      "Direito Tributário",
      "Contabilidade Geral",
      "Contabilidade Pública",
      "Auditoria",
      "Administração Financeira e Orçamentária (AFO)",
      "Administração Geral e Pública",
      "Economia",
      "Legislação Aduaneira",
      "Comércio Internacional",
    ],
  },
  {
    group: "6. Eixo Trabalhista e Eleitoral",
    options: ["Direito do Trabalho", "Direito Processual do Trabalho", "Direito Eleitoral"],
  },
  {
    group: "7. Específicas Policiais",
    options: ["Legislação de Trânsito", "Física"],
  },
];

interface PomodoroPanelProps {
  soundOption: SoundOption;
  isVip?: boolean;
  isActiveTab?: boolean;
  onSessionComplete: (session: Omit<StudySession, "id">) => void;
}

export function PomodoroPanel({
  soundOption,
  isVip = false,
  isActiveTab = true,
  onSessionComplete,
}: PomodoroPanelProps) {
  const searchParams = useSearchParams();

  const [ctx, setCtx] = useState(() => loadPomodoroContext());
  const { preset, queue, isQueueMode, subjectCategory, customSubject, complement, topicId } = ctx;

  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [notifiedForRun, setNotifiedForRun] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [noQuestions, setNoQuestions] = useState(false);

  // Persiste contexto sempre que mudar
  useEffect(() => {
    savePomodoroContext(ctx);
  }, [ctx]);

  // Inicializa via parâmetros de URL (quando vem do Edital Verticalizado)
  useEffect(() => {
    const initSubject = searchParams?.get("subject");
    const initTopic = searchParams?.get("topic");
    const initTopicId = searchParams?.get("topicId");
    const initDuration = searchParams?.get("duration"); // em segundos

    if (!initSubject && !initTopic && !initTopicId && !initDuration) return;

    setCtx((prev) => {
      const next = { ...prev };
      if (initSubject) {
        const known = SUBJECT_GROUPS.some((g) => g.options.includes(initSubject));
        if (known) {
          next.subjectCategory = initSubject;
          next.customSubject = "";
        } else {
          next.subjectCategory = "outra";
          next.customSubject = initSubject;
        }
      }
      if (initTopic !== null && initTopic !== undefined) {
        next.complement = initTopic;
      }
      if (initTopicId !== null && initTopicId !== undefined) {
        next.topicId = initTopicId;
      }
      if (initDuration) {
        const mins = Math.floor(Number(initDuration) / 60);
        const newQueue: PomodoroPreset[] = [];
        let remaining = mins;
        while (remaining > 0) {
          if (remaining >= 25) {
            newQueue.push({ label: "25 min Foco", minutes: 25, kind: "foco" });
            remaining -= 25;
            if (remaining > 0) {
              newQueue.push({ label: "5 min Pausa", minutes: 5, kind: "pausa" });
            }
          } else {
            newQueue.push({ label: `${remaining} min Foco (Final)`, minutes: remaining, kind: "foco" });
            remaining = 0;
          }
        }
        if (newQueue.length > 0) {
          next.preset = newQueue[0];
          next.queue = newQueue.slice(1);
          next.isQueueMode = true;
        }
      }
      return next;
    });
  }, [searchParams]);

  const durationMs = preset.minutes * 60 * 1000;
  const { runtime, elapsedMs, start, pause, reset } = useTimerEngine(
    "timer:pomodoro",
    durationMs,
  );

  const clampedElapsedMs = Math.min(elapsedMs, durationMs);
  const remainingSeconds = Math.max(0, Math.round((durationMs - clampedElapsedMs) / 1000));
  const isDone = elapsedMs >= durationMs;
  const progressRatio = durationMs > 0 ? Math.min(1, clampedElapsedMs / durationMs) : 0;

  useEffect(() => {
    if (isDone && runtime.running) pause();
  }, [isDone, runtime.running, pause]);

  useEffect(() => {
    if (runtime.running) {
      document.title = `(${formatMmSs(remainingSeconds)}) Timer do Concurseiro`;
    } else {
      document.title = "Timer do Concurseiro";
    }
  }, [remainingSeconds, runtime.running]);

  // Dispara conclusão do bloco (mesmo que o bloco tenha acabado com a aba fechada e sido reaberto)
  useEffect(() => {
    if (!isDone || notifiedForRun || showEndModal) return;

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
            ? "Foco concluído! " + (queue.length > 0 ? "Hora da pausa." : "Sessão finalizada.")
            : "Pausa concluída! Hora de voltar ao foco.",
      });
    }

    if (preset.kind === "foco") {
      if (isQueueMode && queue.length > 0) {
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
          topicId: topicId || null,
        });

        const next = queue[0];
        setCtx((prev) => ({ ...prev, preset: next, queue: prev.queue.slice(1) }));
        reset();
        setNotifiedForRun(false);
        setTimeout(() => start(), 500);
      } else {
        setShowEndModal(true);
      }
    } else {
      if (isQueueMode && queue.length > 0) {
        const next = queue[0];
        setCtx((prev) => ({ ...prev, preset: next, queue: prev.queue.slice(1) }));
        reset();
        setNotifiedForRun(false);
        setTimeout(() => start(), 500);
      } else {
        reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, notifiedForRun, showEndModal]);

  // Atalho de teclado: Espaço inicia/pausa quando não está digitando em input
  useEffect(() => {
    if (!isActiveTab || showEndModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      e.preventDefault();
      if (runtime.running) {
        pause();
      } else if (!isDone) {
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveTab, showEndModal, runtime.running, isDone]);

  useEffect(() => {
    return () => {
      stopAlert();
    };
  }, []);

  async function handleConfirmEndSession() {
    const now = new Date();
    let finalSubject = subjectCategory === "outra" ? customSubject.trim() : subjectCategory;
    if (!finalSubject) finalSubject = "Sem matéria definida";

    const fullSubject = complement.trim() ? `${finalSubject} (${complement.trim()})` : finalSubject;

    const parsedCorrect = parseInt(correctAnswers, 10);
    const parsedTotal = parseInt(totalQuestions, 10);
    const netSeconds = Math.max(1, Math.round(clampedElapsedMs / 1000));

    onSessionComplete({
      subject: fullSubject,
      mode: "pomodoro",
      netSeconds,
      startedAt: new Date(now.getTime() - netSeconds * 1000).toISOString(),
      endedAt: now.toISOString(),
      topicId: topicId || null,
      correctAnswers: noQuestions ? null : isNaN(parsedCorrect) ? null : parsedCorrect,
      totalQuestions: noQuestions ? null : isNaN(parsedTotal) ? null : parsedTotal,
    });

    setShowEndModal(false);
    setCorrectAnswers("");
    setTotalQuestions("");
    setNoQuestions(false);

    stopAlert();
    reset();
    setNotifiedForRun(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("timer:pomodoro");
    }
  }

  function selectPreset(next: PomodoroPreset) {
    if (runtime.running) return;
    reset();
    setNotifiedForRun(false);
    setCtx((prev) => ({ ...prev, preset: next, queue: [], isQueueMode: false }));
    stopAlert();
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
    unlockAudio();
    stopAlert();
    setNotifiedForRun(false);
    start();
  }

  function handleZerar() {
    reset();
    stopAlert();
    setNotifiedForRun(false);
  }

  // Anel SVG de progresso
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="flex flex-col items-center gap-4">
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

      {/* Relógio com Anel SVG de Progresso */}
      <div
        className={`relative flex h-56 w-56 items-center justify-center rounded-full font-display text-5xl tabular-nums transition ${
          runtime.running
            ? preset.kind === "pausa"
              ? "shadow-[0_0_40px_rgba(16,185,129,0.28)]"
              : "shadow-[0_0_40px_rgba(56,189,248,0.28)]"
            : ""
        }`}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 224 224">
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-app-border"
          />
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-[stroke-dashoffset] duration-300 ${
              preset.kind === "pausa" ? "text-emerald-500" : "text-accent"
            }`}
          />
        </svg>
        <span className="relative z-10">{formatMmSs(remainingSeconds)}</span>
      </div>

      <p className="text-sm text-text-secondary">
        Modo atual:{" "}
        <span
          className={`font-medium ${
            preset.kind === "pausa" ? "text-emerald-400" : "text-text-primary"
          }`}
        >
          {preset.kind === "foco" ? "Foco" : "Pausa"}
        </span>
        {isQueueMode && queue.length > 0 && (
          <span className="ml-2 text-xs text-slate-400">
            • +{queue.length} bloco(s) na fila
          </span>
        )}
      </p>

      {/* Formulário de Disciplina e Complemento */}
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
            disabled={isDone}
            className={`rounded-2xl px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90 disabled:opacity-40 ${
              preset.kind === "pausa"
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-action-start to-action-end"
            }`}
          >
            {elapsedMs > 0 ? "Retomar" : "Iniciar"}
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
        {!runtime.running && elapsedMs > 0 && preset.kind === "foco" && (
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="rounded-2xl border border-app-border px-6 py-2.5 font-medium text-accent transition hover:bg-accent/10"
          >
            Salvar Progresso
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

      <p className="text-[11px] text-text-secondary">
        Dica: pressione <kbd className="rounded border border-app-border px-1.5 py-0.5 text-[10px]">Espaço</kbd> para iniciar ou pausar.
      </p>

      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-100">Sessão Concluída!</h3>
              {isVip ? (
                <p className="text-slate-400 text-sm">Registre seu desempenho (Opcional)</p>
              ) : (
                <p className="text-slate-400 text-sm">Sessão finalizada com sucesso!</p>
              )}
            </div>

            {isVip && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={noQuestions}
                    onChange={(e) => setNoQuestions(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-accent focus:ring-accent focus:ring-offset-slate-900"
                  />
                  Não resolvi questões
                </label>

                {!noQuestions && (
                  <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-semibold text-slate-400">Acertos</label>
                      <input
                        type="number"
                        min="0"
                        value={correctAnswers}
                        onChange={(e) => setCorrectAnswers(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-semibold text-slate-400">Total</label>
                      <input
                        type="number"
                        min="0"
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(e.target.value)}
                        placeholder="Ex: 20"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirmEndSession}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              {isVip ? "Salvar Sessão" : "Salvar Tempo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
