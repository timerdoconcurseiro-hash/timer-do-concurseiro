"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Loader2, Wand2, Target, Trash2, Edit2, Check } from "lucide-react";
import { saveGeneratedEdital, toggleTopicCompleted, deleteEditalVerticalizado } from "@/app/actions";
import { useRouter } from "next/navigation";

export function EditalVerticalizado({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  
  // Nome do Concurso
  const [examName, setExamName] = useState("Meu Concurso Alvo");
  const [isEditingName, setIsEditingName] = useState(false);

  const hasEdital = initialData && initialData.length > 0;

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("timer_exam_name");
      if (savedName) setExamName(savedName);
    } catch {
      // localStorage unavailable — use default
    }
  }, []);

  const saveExamName = () => {
    try {
      localStorage.setItem("timer_exam_name", examName);
    } catch {
      // Quota exceeded — silently ignore
    }
    setIsEditingName(false);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir todo o edital? Todo o progresso será perdido e você começará do zero.")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteEditalVerticalizado();
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Converte arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!syllabusText && !pdfFile) {
      alert("Cole o texto do edital ou envie um arquivo PDF.");
      return;
    }
    if (!pdfFile && syllabusText.length < 50) {
      alert("O texto colado é muito curto.");
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
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSubject = (id: string) => {
    setOpenSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleTopic = async (topicId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    await toggleTopicCompleted(topicId, newStatus);
    router.refresh();
  };

  if (!hasEdital) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl mb-2">
          <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
            <Wand2 size={18} /> Edital Mágico (IA)
          </h4>
          <p className="text-sm text-amber-200/80 mb-4 leading-relaxed">
            Nossa Inteligência Artificial vai ler o seu edital, extrair as matérias, criar a lista de tópicos detalhada e estimar a carga horária necessária. Escolha enviar o PDF ou colar o texto.
          </p>
          
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 mb-4">
            <h5 className="text-slate-300 font-semibold mb-2 text-sm flex items-center gap-2">
              Opção 1: Enviar Arquivo PDF
            </h5>
            <div className="text-xs text-amber-500/80 mb-3 bg-amber-500/5 p-2 rounded border border-amber-500/20">
              <strong>⚠️ ATENÇÃO:</strong> Envie um PDF contendo <strong>apenas a parte do "Conteúdo Programático"</strong> (o anexo das matérias). Não envie o edital completo de 100 páginas para evitar que a IA se confunda ou consuma tempo excessivo.
            </div>
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => {
                setPdfFile(e.target.files?.[0] || null);
                setSyllabusText(""); // Limpa o texto se escolher arquivo
              }}
              className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30"
            />
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-xs text-slate-500 font-bold uppercase">OU</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 mt-4">
            <h5 className="text-slate-300 font-semibold mb-2 text-sm flex items-center gap-2">
              Opção 2: Colar o Texto
            </h5>
            <textarea 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-amber-500 min-h-[150px] transition-colors disabled:opacity-50"
              placeholder="Ex: LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos. 2 Tipologia textual..."
              value={syllabusText}
              disabled={pdfFile !== null}
              onChange={(e) => setSyllabusText(e.target.value)}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (!syllabusText && !pdfFile)}
            className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {isGenerating ? "A IA está processando seu edital (pode demorar alguns segundos)..." : "Gerar Edital Inteligente"}
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalTopics = initialData.reduce((acc, subj) => acc + subj.edital_topics.length, 0);
  const completedTopics = initialData.reduce((acc, subj) => acc + subj.edital_topics.filter((t: any) => t.completed).length, 0);
  const progressPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header Interativo (Nome e Excluir) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Target className="text-emerald-400" size={24} />
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={examName} 
                onChange={(e) => setExamName(e.target.value)}
                className="bg-slate-950 border border-amber-500/50 rounded p-1 text-white text-lg font-bold focus:outline-none w-full max-w-[200px]"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveExamName()}
              />
              <button onClick={saveExamName} className="text-emerald-400 hover:bg-emerald-400/20 p-1.5 rounded transition">
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-xl font-bold text-white">{examName}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-400">
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Excluir Edital
        </button>
      </div>

      {/* Progresso Geral */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400 font-medium">Progresso Geral</span>
          <span className="text-emerald-400 font-bold">{progressPercent}% ({completedTopics}/{totalTopics})</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Lista Verticalizada */}
      <div className="space-y-3">
        {initialData.map((subject) => {
          const sTotal = subject.edital_topics.length;
          const sCompleted = subject.edital_topics.filter((t: any) => t.completed).length;
          const sPercent = sTotal === 0 ? 0 : Math.round((sCompleted / sTotal) * 100);
          const isOpen = openSubjects[subject.id];

          return (
            <div key={subject.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden transition-all hover:border-slate-700">
              {/* Header do Subject */}
              <button 
                onClick={() => toggleSubject(subject.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">{subject.name}</span>
                  <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Target size={12} /> Meta: {subject.target_hours}h 
                    <span className="mx-2">•</span> 
                    Concluído: {sPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 bg-slate-800 rounded-full h-1.5 hidden md:block">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${sPercent}%` }}></div>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {/* Tópicos */}
              {isOpen && (
                <div className="border-t border-slate-800/50 bg-slate-900/20 p-2">
                  {subject.edital_topics.map((topic: any) => (
                    <button
                      key={topic.id}
                      onClick={() => handleToggleTopic(topic.id, topic.completed)}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-800/50 rounded-lg text-left transition-colors group"
                    >
                      {topic.completed ? (
                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={18} className="text-slate-600 group-hover:text-amber-500 shrink-0" />
                      )}
                      <span className={`text-sm ${topic.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {topic.name}
                      </span>
                    </button>
                  ))}
                  {subject.edital_topics.length === 0 && (
                    <div className="p-3 text-xs text-slate-500 text-center">Nenhum tópico encontrado.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
