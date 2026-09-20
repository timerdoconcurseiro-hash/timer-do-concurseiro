"use client";

import { useEffect, useState, useRef } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatMmSs } from "@/lib/timer-engine/engine";
import { playAlert, unlockAudio, stopAlert, type SoundOption } from "@/lib/sounds/beep";
import type { StudySession } from "@/lib/storage/sessions";
import { useSearchParams, useRouter } from "next/navigation";
import { toggleTopicCompleted } from "@/app/actions";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [preset, setPreset] = useState<Preset>(() => loadPreset());
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  
  // Novos campos de disciplina e complemento
  const [subjectCategory, setSubjectCategory] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [complement, setComplement] = useState("");
  
  const [notifiedForRun, setNotifiedForRun] = useState(false);

  // Fila de Pomodoro (Queue)
  const [queue, setQueue] = useState<Preset[]>([]);
  const [isQueueMode, setIsQueueMode] = useState(false);

  // Modal de término
  const [showEndModal, setShowEndModal] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");

  const topicId = searchParams?.get("topicId") || "";

  // Inicializa via parâmetros de URL
  useEffect(() => {
    const initSubject = searchParams?.get("subject");
    const initTopic = searchParams?.get("topic");
    const initDuration = searchParams?.get("duration"); // em segundos

    if (initSubject && !subjectCategory) {
      setSubjectCategory("outra");
      setCustomSubject(initSubject);
    }
    if (initTopic && !complement) {
      setComplement(initTopic);
    }
    if (initDuration) {
      const mins = Math.floor(Number(initDuration) / 60);
      
      const newQueue: Preset[] = [];
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
        setPreset(newQueue[0]);
        setQueue(newQueue.slice(1));
        setIsQueueMode(true);
      }
    }
  }, [searchParams]);

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
            ? "Foco concluído! " + (queue.length > 0 ? "Hora da pausa." : "Sessão finalizada.")
            : "Pausa concluída! Hora de voltar ao foco.",
      });
    }

    if (preset.kind === "foco") {
      if (isQueueMode && queue.length > 0) {
        // Salva apenas este bloco e avança
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
        
        // Próximo da fila
        const next = queue[0];
        setQueue(queue.slice(1));
        setPreset(next);
        reset();
        setNotifiedForRun(false);
        setTimeout(() => start(), 500);
      } else {
        // Último bloco (ou modo normal) abre o modal
        setShowEndModal(true);
      }
    } else {
      // É pausa, transita automático para o próximo foco
      if (isQueueMode && queue.length > 0) {
        const next = queue[0];
        setQueue(queue.slice(1));
        setPreset(next);
        reset();
        setNotifiedForRun(false);
        setTimeout(() => start(), 500);
      } else {
        reset();
      }
    }

    if (!isQueueMode && preset.kind !== "foco") {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, notifiedForRun]);

  async function handleConfirmEndSession() {
    const now = new Date();
    let finalSubject = subjectCategory === "outra" ? customSubject.trim() : subjectCategory;
    if (!finalSubject) finalSubject = "Sem matéria definida";
    
    // Anexa as questões se houver
    let stats = "";
    if (totalQuestions && correctAnswers) {
      stats = ` [${correctAnswers}/${totalQuestions} acertos]`;
    }
    
    const fullSubject = complement.trim() ? `${finalSubject} (${complement.trim()})${stats}` : `${finalSubject}${stats}`;

    onSessionComplete({
      subject: fullSubject,
      mode: "pomodoro",
      netSeconds: preset.minutes * 60,
      startedAt: new Date(now.getTime() - preset.minutes * 60000).toISOString(),
      endedAt: now.toISOString(),
    });

    if (topicId) {
      await toggleTopicCompleted(topicId, true);
    }

    setShowEndModal(false);
    setCorrectAnswers("");
    setTotalQuestions("");
  }

  function selectPreset(next: Preset) {
    if (runtime.running) return;
    reset();
    savePreset(next);
    setNotifiedForRun(false);
    setPreset(next);
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
    unlockAudio(); // Desbloqueia o áudio na primeira interação do usuário
    stopAlert(); // Para o alarme se ainda estiver tocando
    setNotifiedForRun(false);
    start();
  }

  function handleZerar() {
    reset();
    stopAlert();
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

      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-100">Sessão Concluída!</h3>
              <p className="text-slate-400 text-sm">Registre seu desempenho (Opcional)</p>
            </div>
            
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

            <button
              onClick={handleConfirmEndSession}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              Salvar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
