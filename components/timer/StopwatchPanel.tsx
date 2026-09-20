"use client";

import { useState } from "react";
import { useTimerEngine } from "@/lib/timer-engine/useTimerEngine";
import { formatHms } from "@/lib/timer-engine/engine";
import type { StudySession } from "@/lib/storage/sessions";

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

interface StopwatchPanelProps {
  onSessionSaved: (session: Omit<StudySession, "id">) => void;
}

export function StopwatchPanel({ onSessionSaved }: StopwatchPanelProps) {
  const [subjectCategory, setSubjectCategory] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [complement, setComplement] = useState("");

  const { runtime, elapsedMs, start, pause, reset } =
    useTimerEngine("timer:stopwatch");

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  function handleSave() {
    if (elapsedSeconds <= 0) return;
    if (runtime.running) pause();

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
    });

    reset();
    setSubjectCategory("");
    setCustomSubject("");
    setComplement("");
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-56 w-56 items-center justify-center rounded-full border-4 border-app-border font-display text-4xl tabular-nums">
        {formatHms(elapsedSeconds)}
      </div>

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
