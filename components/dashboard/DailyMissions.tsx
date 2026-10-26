"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Play, Sparkles, BookOpen, Clock, Brain, Shuffle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toggleTopicCompleted, type EditalSubject } from "@/app/actions";
import { useRouter } from "next/navigation";

type MissionTopic = {
  id: string;
  name: string;
  subjectName: string;
};

export function DailyMissions({ initialData }: { initialData: EditalSubject[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<EditalSubject[]>(initialData || []);
  const [offset, setOffset] = useState(0);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    setSubjects(initialData || []);
  }, [initialData]);

  useEffect(() => {
    const onExternalToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ topicId: string; completed: boolean }>).detail;
      if (!detail) return;
      setSubjects((prev) =>
        prev.map((s) => ({
          ...s,
          edital_topics: s.edital_topics.map((t) =>
            t.id === detail.topicId ? { ...t, completed: detail.completed } : t
          ),
        }))
      );
    };
    window.addEventListener("edital:topicToggled", onExternalToggle);
    return () => window.removeEventListener("edital:topicToggled", onExternalToggle);
  }, []);

  if (!subjects || subjects.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center bg-slate-900/40 rounded-xl border border-slate-800">
        Cadastre seu edital primeiro para gerar suas missões diárias intercaladas.
      </div>
    );
  }

  // Coleta tópicos não concluídos intercalando disciplinas (Prática Intercalada)
  const subjectsWithPending = subjects
    .map((s) => ({
      name: s.name,
      pending: s.edital_topics.filter((t) => !t.completed),
    }))
    .filter((s) => s.pending.length > 0);

  const interleaved: MissionTopic[] = [];
  const buckets = subjectsWithPending.map((s) => ({
    name: s.name,
    queue: [...s.pending],
  }));

  let idx = 0;
  while (buckets.length > 0) {
    const bIndex = idx % buckets.length;
    const b = buckets[bIndex];
    const topic = b.queue.shift();
    if (topic) {
      interleaved.push({ id: topic.id, name: topic.name, subjectName: b.name });
    }
    if (b.queue.length === 0) {
      buckets.splice(bIndex, 1);
    } else {
      idx++;
    }
  }

  if (interleaved.length === 0) {
    return (
      <div className="p-6 bg-emerald-900/20 rounded-xl border border-emerald-900/50 text-center">
        <Sparkles className="text-emerald-400 mx-auto mb-3" size={32} />
        <h4 className="text-emerald-400 font-bold mb-2">Edital Finalizado!</h4>
        <p className="text-sm text-emerald-200/70">
          Você concluiu todos os tópicos do seu edital. Incrível!
        </p>
      </div>
    );
  }

  const missions: MissionTopic[] = [];
  const count = Math.min(3, interleaved.length);
  for (let k = 0; k < count; k++) {
    missions.push(interleaved[(offset + k) % interleaved.length]);
  }

  const handleComplete = (topicId: string) => {
    setCompletingId(topicId);
    // Atualização instantânea
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        edital_topics: s.edital_topics.map((t) =>
          t.id === topicId ? { ...t, completed: true } : t
        ),
      }))
    );
    window.dispatchEvent(
      new CustomEvent("edital:topicToggled", { detail: { topicId, completed: true } })
    );
    toggleTopicCompleted(topicId, true).finally(() => {
      setCompletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-amber-400 font-bold text-sm flex items-center gap-2">
            <Sparkles size={16} /> Cronograma Intercalado
          </h4>
          <p className="text-xs text-amber-200/80 mt-1">
            {interleaved.length} tópico(s) pendente(s) no edital.
          </p>
        </div>
        {interleaved.length > 3 && (
          <button
            type="button"
            onClick={() => setOffset((prev) => (prev + 3) % interleaved.length)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
            title="Sugerir outras missões"
          >
            <Shuffle size={12} /> Trocar
          </button>
        )}
      </div>

      <div className="space-y-3">
        {missions.map((topic, index) => (
          <div
            key={topic.id}
            className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 truncate">
                  Missão {index + 1} • {topic.subjectName}
                </span>
                <h5 className="text-sm font-semibold text-slate-200 mb-2 break-words">{topic.name}</h5>

                <div className="flex gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> Teoria + Questões
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> ~1h15m
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href={`/timer?subject=${encodeURIComponent(topic.subjectName)}&topic=${encodeURIComponent(topic.name)}&topicId=${topic.id}&duration=4500`}
                  className="bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  title="Iniciar Timer para esta missão"
                >
                  <Play size={15} className="ml-0.5" />
                </Link>
                <Link
                  href={`/vip?subject=${encodeURIComponent(topic.subjectName)}&topic=${encodeURIComponent(topic.name)}#ai-room`}
                  className="bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  title="Gerar Resumo e Flashcards (Sala de I.A)"
                >
                  <Brain size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleComplete(topic.id)}
                  disabled={completingId === topic.id}
                  className="bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                  title="Marcar missão como concluída"
                >
                  {completingId === topic.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle size={15} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
