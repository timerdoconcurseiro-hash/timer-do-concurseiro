"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Wand2,
  Target,
  Trash2,
  Edit2,
  Check,
  Plus,
  Search,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  saveGeneratedEdital,
  setTopicStatus,
  deleteEditalVerticalizado,
  addEditalSubject,
  updateEditalSubject,
  deleteEditalSubject,
  addEditalTopic,
  deleteEditalTopic,
  saveExamNameAction,
  type EditalSubject,
  type TopicStatus,
} from "@/app/actions";
import { useRouter } from "next/navigation";
import { SubjectRow } from "./SubjectRow";

type StatusFilter = "all" | TopicStatus;

export function EditalBoard({
  initialData,
  initialExamName,
}: {
  initialData: EditalSubject[];
  initialExamName?: string;
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<EditalSubject[]>(initialData || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Busca com useDeferredValue (não trava digitação em editais gigantes)
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Nome do Concurso
  const [examName, setExamName] = useState(initialExamName || "Meu Concurso Alvo");
  const [isEditingName, setIsEditingName] = useState(false);

  // Criação manual de Matéria
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjHours, setNewSubjHours] = useState("20");
  const [savingSubj, setSavingSubj] = useState(false);

  // Modo de criação quando o edital está vazio ("ai" | "manual")
  const [emptyTab, setEmptyTab] = useState<"ai" | "manual">("ai");

  // Controle de versão por tópico para evitar rollback obsoleto em cliques rápidos no semáforo
  const topicVersionRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (initialExamName) return;
    const timer = setTimeout(() => {
      try {
        const savedName = localStorage.getItem("timer_exam_name");
        if (savedName) setExamName(savedName);
      } catch {
        // localStorage unavailable
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialExamName]);

  const saveExamName = () => {
    const clean = examName.trim() || "Meu Concurso Alvo";
    setExamName(clean);
    try {
      localStorage.setItem("timer_exam_name", clean);
    } catch {
      // ignore
    }
    setIsEditingName(false);
    saveExamNameAction(clean).catch(() => {});
  };

  const handleDeleteAll = async () => {
    if (!confirm("Tem certeza que deseja excluir todo o edital? Todo o progresso será perdido.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteEditalVerticalizado();
      if (!res.success) throw new Error(res.error);
      setSubjects([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir edital.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = (err) => reject(err);
    });

  const handleGenerate = async () => {
    setError(null);
    if (!syllabusText && !pdfFile) {
      setError("Cole o texto do edital ou envie um arquivo PDF.");
      return;
    }
    if (!pdfFile && syllabusText.trim().length < 50) {
      setError("O texto colado é muito curto (mínimo 50 caracteres).");
      return;
    }

    setIsGenerating(true);
    try {
      let payload: Record<string, unknown> = { syllabusText };
      if (pdfFile) {
        if (pdfFile.size > 5 * 1024 * 1024) {
          throw new Error("O PDF é muito grande. Envie no máximo 5MB.");
        }
        const base64 = await fileToBase64(pdfFile);
        payload = { pdfBase64: base64 };
      }

      const res = await fetch("/api/ai/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar edital com IA.");

      const saveRes = await saveGeneratedEdital(json.data);
      if (!saveRes.success) throw new Error(saveRes.error);

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao gerar edital.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubject = async () => {
    const clean = newSubjName.trim();
    if (!clean) return;
    setSavingSubj(true);
    setError(null);
    try {
      const hours = Math.max(0, Number(newSubjHours) || 0);
      const res = await addEditalSubject(clean, hours);
      if (!res.success) throw new Error(res.error);
      if (res.subject) {
        setSubjects((prev) => [...prev, res.subject!]);
      } else {
        router.refresh();
      }
      setNewSubjName("");
      setNewSubjHours("20");
      setAddingSubject(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar matéria.");
    } finally {
      setSavingSubj(false);
    }
  };

  const handleSaveEditSubject = useCallback(
    async (subjectId: string, name: string, targetHours: number) => {
      setSubjects((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, name, target_hours: targetHours } : s))
      );
      const res = await updateEditalSubject(subjectId, { name, targetHours });
      if (!res.success) {
        setError(res.error || "Erro ao atualizar matéria.");
      }
    },
    []
  );

  const handleDeleteSubject = useCallback(async (subjectId: string, name: string) => {
    if (!confirm(`Excluir a matéria "${name}" e todos os seus tópicos?`)) return;
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    const res = await deleteEditalSubject(subjectId);
    if (!res.success) setError(res.error || "Erro ao excluir matéria.");
  }, []);

  const handleStatusChange = useCallback(
    (subjectId: string, topicId: string, nextStatus: TopicStatus) => {
      const nextVersion = (topicVersionRef.current[topicId] || 0) + 1;
      topicVersionRef.current[topicId] = nextVersion;

      let prevStatus: TopicStatus = "none";

      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            edital_topics: s.edital_topics.map((t) => {
              if (t.id !== topicId) return t;
              prevStatus = t.status;
              return { ...t, status: nextStatus, completed: nextStatus === "green" };
            }),
          };
        })
      );

      setTopicStatus(topicId, nextStatus).then((res) => {
        // Só faz rollback se esta ainda for a mutação mais recente deste tópico
        if (!res.success && topicVersionRef.current[topicId] === nextVersion) {
          setError(res.error || "Erro ao atualizar cor do semáforo.");
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId
                ? {
                    ...s,
                    edital_topics: s.edital_topics.map((t) =>
                      t.id === topicId
                        ? { ...t, status: prevStatus, completed: prevStatus === "green" }
                        : t
                    ),
                  }
                : s
            )
          );
        }
      });
    },
    []
  );

  const handleAddTopic = useCallback(async (subjectId: string, text: string): Promise<boolean> => {
    setError(null);
    const res = await addEditalTopic(subjectId, text);
    if (!res.success) {
      setError(res.error || "Erro ao adicionar tópico.");
      return false;
    }
    if (res.topic) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, edital_topics: [...s.edital_topics, res.topic!] } : s
        )
      );
    }
    return true;
  }, []);

  const handleDeleteTopic = useCallback(async (subjectId: string, topicId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, edital_topics: s.edital_topics.filter((t) => t.id !== topicId) }
          : s
      )
    );
    const res = await deleteEditalTopic(topicId);
    if (!res.success) setError(res.error || "Erro ao remover tópico.");
  }, []);

  const toggleSubject = useCallback((id: string) => {
    setOpenSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Métricas globais memoizadas
  const stats = useMemo(() => {
    let total = 0;
    let none = 0;
    let red = 0;
    let yellow = 0;
    let green = 0;
    let targetHours = 0;
    let studiedHours = 0;

    for (const s of subjects) {
      targetHours += s.target_hours || 0;
      studiedHours += s.studied_hours || 0;
      for (const t of s.edital_topics) {
        total++;
        if (t.status === "green") green++;
        else if (t.status === "yellow") yellow++;
        else if (t.status === "red") red++;
        else none++;
      }
    }

    const percent = total === 0 ? 0 : Math.round((green / total) * 100);
    return {
      total,
      none,
      red,
      yellow,
      green,
      percent,
      targetHours,
      studiedHours: Number(studiedHours.toFixed(1)),
    };
  }, [subjects]);

  const hasEdital = subjects.length > 0;

  if (!hasEdital) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setEmptyTab("ai")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              emptyTab === "ai"
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Wand2 size={14} /> Gerar com IA (PDF ou Texto)
          </button>
          <button
            type="button"
            onClick={() => setEmptyTab("manual")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              emptyTab === "manual"
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Plus size={14} /> Criar Manualmente
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {emptyTab === "ai" ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl">
            <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
              <Wand2 size={18} /> Edital Mágico (IA)
            </h4>
            <p className="text-sm text-amber-200/80 mb-4 leading-relaxed">
              Nossa Inteligência Artificial lê seu edital, extrai as matérias, cria os tópicos detalhados e estima a carga horária necessária.
            </p>

            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 mb-4">
              <h5 className="text-slate-300 font-semibold mb-2 text-sm">Opção 1: Enviar Arquivo PDF</h5>
              <div className="text-xs text-amber-500/80 mb-3 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                <strong>ATENÇÃO:</strong> Envie um PDF contendo apenas o <strong>Conteúdo Programático</strong> (máx. 5MB).
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setPdfFile(e.target.files?.[0] || null);
                  setSyllabusText("");
                }}
                className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30"
              />
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-xs text-slate-500 font-bold uppercase">OU</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 mt-4">
              <h5 className="text-slate-300 font-semibold mb-2 text-sm">Opção 2: Colar o Texto</h5>
              <textarea
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-amber-500 min-h-[140px] transition-colors disabled:opacity-50"
                placeholder="Ex: LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos. 2 Tipologia textual..."
                value={syllabusText}
                disabled={pdfFile !== null}
                onChange={(e) => setSyllabusText(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (!syllabusText && !pdfFile)}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {isGenerating ? "Processando seu edital com IA..." : "Gerar Edital Inteligente"}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
            <h4 className="text-emerald-400 font-bold text-sm flex items-center gap-2">
              <Plus size={16} /> Adicionar Primeira Matéria
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome da matéria (ex: Direito Constitucional)"
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
              <input
                type="number"
                min="0"
                placeholder="Meta (horas)"
                value={newSubjHours}
                onChange={(e) => setNewSubjHours(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={savingSubj || !newSubjName.trim()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingSubj ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Criar Matéria
            </button>
          </div>
        )}
      </div>
    );
  }

  const query = deferredQuery.trim().toLowerCase();

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start justify-between gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <span className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Interativo (Nome, Nova Matéria e Excluir) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Target className="text-emerald-400" size={22} />
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-white text-base font-bold focus:outline-none max-w-[240px]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveExamName()}
              />
              <button
                type="button"
                onClick={saveExamName}
                className="text-emerald-400 hover:bg-emerald-400/20 p-1.5 rounded"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-lg font-bold text-white">{examName}</h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-slate-500 hover:text-amber-400 transition-colors"
                title="Renomear concurso"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAddingSubject((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 transition-colors"
          >
            <Plus size={14} /> Nova Matéria
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/20"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Resetar Edital
          </button>
        </div>
      </div>

      {/* Formulário Nova Matéria */}
      {addingSubject && (
        <div className="bg-slate-900/70 border border-emerald-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Adicionar Matéria
            </span>
            <button
              type="button"
              onClick={() => setAddingSubject(false)}
              className="text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nome da matéria"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
            <input
              type="number"
              min="0"
              placeholder="Meta de horas"
              value={newSubjHours}
              onChange={(e) => setNewSubjHours(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSubject}
            disabled={savingSubj || !newSubjName.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {savingSubj ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{" "}
            Salvar Matéria
          </button>
        </div>
      )}

      {/* Resumo do Semáforo + Horas */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-slate-300 font-medium">
            Domínio do Edital:{" "}
            <strong className="text-emerald-400">
              {stats.green}/{stats.total}
            </strong>{" "}
            ({stats.percent}%)
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1">
            <Clock size={13} className="text-cyan-400" />
            Horas no Timer: <strong className="text-cyan-300">{stats.studiedHours}h</strong>
            {stats.targetHours > 0 && <span>/ {stats.targetHours}h estimadas</span>}
          </span>
        </div>

        {/* Barra de progresso multicolorida do Semáforo */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
          {stats.total > 0 && (
            <>
              <div
                className="bg-emerald-500 h-2.5 transition-all duration-300"
                style={{ width: `${(stats.green / stats.total) * 100}%` }}
                title={`Domino: ${stats.green}`}
              />
              <div
                className="bg-amber-400 h-2.5 transition-all duration-300"
                style={{ width: `${(stats.yellow / stats.total) * 100}%` }}
                title={`Preciso revisar: ${stats.yellow}`}
              />
              <div
                className="bg-red-500 h-2.5 transition-all duration-300"
                style={{ width: `${(stats.red / stats.total) * 100}%` }}
                title={`Não domino: ${stats.red}`}
              />
            </>
          )}
        </div>

        {/* Legenda interativa (clicar filtra por cor) */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          {(
            [
              ["all", `Todos (${stats.total})`, "border-slate-700 text-slate-300"],
              ["none", `⚪ Não iniciado (${stats.none})`, "border-slate-700 text-slate-400"],
              ["red", `🔴 Não domino (${stats.red})`, "border-red-500/30 text-red-300"],
              ["yellow", `🟡 Preciso revisar (${stats.yellow})`, "border-amber-500/30 text-amber-300"],
              ["green", `🟢 Domino (${stats.green})`, "border-emerald-500/30 text-emerald-300"],
            ] as [StatusFilter, string, string][]
          ).map(([val, label, colorCls]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`px-2.5 py-1 rounded-full border transition-all ${colorCls} ${
                statusFilter === val
                  ? "bg-white/10 ring-1 ring-white/30 font-semibold"
                  : "bg-slate-950/40 opacity-75 hover:opacity-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar matéria ou tópico..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
        />
      </div>

      {/* Lista Verticalizada (Renderiza tópicos apenas quando a matéria está aberta) */}
      <div className="space-y-3">
        {subjects.map((subject) => {
          const filteredTopics = subject.edital_topics.filter((t) => {
            if (statusFilter !== "all" && t.status !== statusFilter) return false;
            if (!query) return true;
            return (
              t.name.toLowerCase().includes(query) || subject.name.toLowerCase().includes(query)
            );
          });

          if (
            (query || statusFilter !== "all") &&
            filteredTopics.length === 0 &&
            !(query && subject.name.toLowerCase().includes(query) && statusFilter === "all")
          ) {
            return null;
          }

          const isOpen =
            Boolean(openSubjects[subject.id]) || Boolean(query) || statusFilter !== "all";

          return (
            <SubjectRow
              key={subject.id}
              subject={subject}
              filteredTopics={filteredTopics}
              isOpen={isOpen}
              onToggleOpen={toggleSubject}
              onSaveEditSubject={handleSaveEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onStatusChange={handleStatusChange}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
            />
          );
        })}
      </div>
    </div>
  );
}
