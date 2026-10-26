"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wand2,
  Target,
  Trash2,
  Edit2,
  Check,
  Plus,
  Search,
  Play,
  Brain,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  saveGeneratedEdital,
  toggleTopicCompleted,
  deleteEditalVerticalizado,
  addEditalSubject,
  updateEditalSubject,
  deleteEditalSubject,
  addEditalTopic,
  deleteEditalTopic,
  type EditalSubject,
} from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function EditalVerticalizado({ initialData }: { initialData: EditalSubject[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<EditalSubject[]>(initialData || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Busca e filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  // Nome do Concurso
  const [examName, setExamName] = useState("Meu Concurso Alvo");
  const [isEditingName, setIsEditingName] = useState(false);

  // Criação manual de Matéria
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjHours, setNewSubjHours] = useState("20");
  const [savingSubj, setSavingSubj] = useState(false);

  // Edição de Matéria
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editSubjName, setEditSubjName] = useState("");
  const [editSubjHours, setEditSubjHours] = useState("");

  // Criação manual de Tópico por matéria
  const [newTopicText, setNewTopicText] = useState<Record<string, string>>({});
  const [savingTopicFor, setSavingTopicFor] = useState<string | null>(null);

  // Modo de criação quando o edital está vazio ("ai" | "manual")
  const [emptyTab, setEmptyTab] = useState<"ai" | "manual">("ai");

  useEffect(() => {
    setSubjects(initialData || []);
  }, [initialData]);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("timer_exam_name");
      if (savedName) setExamName(savedName);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const saveExamName = () => {
    try {
      localStorage.setItem("timer_exam_name", examName.trim() || "Meu Concurso Alvo");
    } catch {
      // ignore
    }
    setIsEditingName(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Tem certeza que deseja excluir todo o edital? Todo o progresso será perdido.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteEditalVerticalizado();
      if (!res.success) throw new Error(res.error);
      setSubjects([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir edital.");
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
      let payload: any = { syllabusText };
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
    } catch (err: any) {
      setError(err.message || "Falha ao gerar edital.");
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
      setNewSubjName("");
      setNewSubjHours("20");
      setAddingSubject(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar matéria.");
    } finally {
      setSavingSubj(false);
    }
  };

  const handleStartEditSubject = (subj: EditalSubject) => {
    setEditingSubjId(subj.id);
    setEditSubjName(subj.name);
    setEditSubjHours(String(subj.target_hours || 0));
  };

  const handleSaveEditSubject = async (subjectId: string) => {
    const clean = editSubjName.trim();
    if (!clean) return;
    const hours = Math.max(0, Number(editSubjHours) || 0);
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, name: clean, target_hours: hours } : s))
    );
    setEditingSubjId(null);
    const res = await updateEditalSubject(subjectId, { name: clean, targetHours: hours });
    if (!res.success) {
      setError(res.error || "Erro ao atualizar matéria.");
    }
    router.refresh();
  };

  const handleDeleteSubject = async (subjectId: string, name: string) => {
    if (!confirm(`Excluir a matéria "${name}" e todos os seus tópicos?`)) return;
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    const res = await deleteEditalSubject(subjectId);
    if (!res.success) setError(res.error || "Erro ao excluir matéria.");
    router.refresh();
  };

  // Escuta conclusões vindas do widget Missões de Hoje
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

  const handleToggleTopic = (subjectId: string, topicId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // 1. Atualização 100% instantânea na UI
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              edital_topics: s.edital_topics.map((t) =>
                t.id === topicId ? { ...t, completed: nextStatus } : t
              ),
            }
          : s
      )
    );
    // 2. Sincroniza imediatamente com o card de Missões de Hoje sem re-renderizar a página
    window.dispatchEvent(
      new CustomEvent("edital:topicToggled", { detail: { topicId, completed: nextStatus } })
    );
    // 3. Salva no banco em background (reverte se der erro)
    toggleTopicCompleted(topicId, nextStatus).then((res) => {
      if (!res.success) {
        setError(res.error || "Erro ao atualizar tópico.");
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  edital_topics: s.edital_topics.map((t) =>
                    t.id === topicId ? { ...t, completed: currentStatus } : t
                  ),
                }
              : s
          )
        );
      }
    });
  };

  const handleAddTopic = async (subjectId: string) => {
    const text = (newTopicText[subjectId] || "").trim();
    if (!text) return;
    setSavingTopicFor(subjectId);
    setError(null);
    try {
      const res = await addEditalTopic(subjectId, text);
      if (!res.success) throw new Error(res.error);
      setNewTopicText((prev) => ({ ...prev, [subjectId]: "" }));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar tópico.");
    } finally {
      setSavingTopicFor(null);
    }
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, edital_topics: s.edital_topics.filter((t) => t.id !== topicId) }
          : s
      )
    );
    const res = await deleteEditalTopic(topicId);
    if (!res.success) setError(res.error || "Erro ao remover tópico.");
    router.refresh();
  };

  const toggleSubject = (id: string) => {
    setOpenSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Totais
  const totalTopics = subjects.reduce((acc, subj) => acc + subj.edital_topics.length, 0);
  const completedTopics = subjects.reduce(
    (acc, subj) => acc + subj.edital_topics.filter((t) => t.completed).length,
    0
  );
  const progressPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const totalTargetHours = subjects.reduce((acc, s) => acc + (s.target_hours || 0), 0);
  const totalStudiedHours = Number(
    subjects.reduce((acc, s) => acc + (s.studied_hours || 0), 0).toFixed(1)
  );

  // Filtragem
  const query = searchQuery.trim().toLowerCase();

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
                className="bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-white text-base font-bold focus:outline-none max-w-[220px]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveExamName()}
              />
              <button type="button" onClick={saveExamName} className="text-emerald-400 hover:bg-emerald-400/20 p-1.5 rounded">
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
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Adicionar Matéria</span>
            <button type="button" onClick={() => setAddingSubject(false)} className="text-slate-500 hover:text-white">
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
            {savingSubj ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar Matéria
          </button>
        </div>
      )}

      {/* Progresso Geral + Horas */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-slate-400 font-medium">
            Tópicos concluídos: <strong className="text-emerald-400">{completedTopics}/{totalTopics}</strong> ({progressPercent}%)
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1">
            <Clock size={13} className="text-cyan-400" />
            Horas no Timer: <strong className="text-cyan-300">{totalStudiedHours}h</strong>
            {totalTargetHours > 0 && <span>/ {totalTargetHours}h estimadas</span>}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar matéria ou tópico..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1 text-xs">
          {(
            [
              ["all", "Todos"],
              ["pending", "Pendentes"],
              ["completed", "Concluídos"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === val ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Verticalizada */}
      <div className="space-y-3">
        {subjects.map((subject) => {
          const filteredTopics = subject.edital_topics.filter((t) => {
            if (statusFilter === "pending" && t.completed) return false;
            if (statusFilter === "completed" && !t.completed) return false;
            if (!query) return true;
            return (
              t.name.toLowerCase().includes(query) || subject.name.toLowerCase().includes(query)
            );
          });

          if (query && filteredTopics.length === 0 && !subject.name.toLowerCase().includes(query)) {
            return null;
          }

          const sTotal = subject.edital_topics.length;
          const sCompleted = subject.edital_topics.filter((t) => t.completed).length;
          const sPercent = sTotal === 0 ? 0 : Math.round((sCompleted / sTotal) * 100);
          const isOpen = openSubjects[subject.id] || Boolean(query);
          const isEditingThis = editingSubjId === subject.id;

          return (
            <div
              key={subject.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden transition-all hover:border-slate-700"
            >
              {isEditingThis ? (
                <div className="p-4 flex flex-wrap items-center gap-2 bg-slate-900/80">
                  <input
                    type="text"
                    value={editSubjName}
                    onChange={(e) => setEditSubjName(e.target.value)}
                    className="flex-1 min-w-[160px] bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    value={editSubjHours}
                    onChange={(e) => setEditSubjHours(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white"
                    placeholder="Horas"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEditSubject(subject.id)}
                    className="p-2 bg-emerald-500 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-1"
                  >
                    <Check size={14} /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSubjId(null)}
                    className="p-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className="flex-1 flex flex-col text-left"
                  >
                    <span className="font-semibold text-slate-200">{subject.name}</span>
                    <span className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        Estudado: <strong className="text-slate-300">{subject.studied_hours || 0}h</strong> / {subject.target_hours}h
                      </span>
                      <span>•</span>
                      <span>
                        Tópicos: {sCompleted}/{sTotal} ({sPercent}%)
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 hidden md:block">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${sPercent}%` }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEditSubject(subject)}
                      className="text-slate-500 hover:text-amber-400 p-1"
                      title="Editar matéria"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Excluir matéria"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className="text-slate-400 p-1"
                      aria-label="Expandir tópicos"
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {isOpen && (
                <div className="border-t border-slate-800/50 bg-slate-900/20 p-2 space-y-1">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between gap-2 p-2 hover:bg-slate-800/50 rounded-lg group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTopic(subject.id, topic.id, topic.completed)}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        {topic.completed ? (
                          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={18} className="text-slate-600 group-hover:text-amber-500 shrink-0" />
                        )}
                        <span
                          className={`text-sm break-words ${
                            topic.completed ? "text-slate-500 line-through" : "text-slate-300"
                          }`}
                        >
                          {topic.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        <Link
                          href={`/timer?subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.name)}&topicId=${topic.id}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          title="Estudar este tópico no Timer"
                        >
                          <Play size={14} />
                        </Link>
                        <Link
                          href={`/vip?subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.name)}#ai-room`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                          title="Gerar resumo/flashcards deste tópico"
                        >
                          <Brain size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(subject.id, topic.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Remover tópico"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredTopics.length === 0 && (
                    <div className="p-3 text-xs text-slate-500 text-center">Nenhum tópico encontrado.</div>
                  )}

                  {/* Adicionar novo tópico */}
                  <div className="flex gap-2 pt-2 px-1">
                    <input
                      type="text"
                      value={newTopicText[subject.id] || ""}
                      onChange={(e) =>
                        setNewTopicText((prev) => ({ ...prev, [subject.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleAddTopic(subject.id)}
                      placeholder="Novo tópico nesta matéria..."
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTopic(subject.id)}
                      disabled={savingTopicFor === subject.id || !(newTopicText[subject.id] || "").trim()}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                    >
                      {savingTopicFor === subject.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
