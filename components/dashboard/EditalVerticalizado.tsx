"use client";

import React, { useState } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Loader2, Wand2, Target } from "lucide-react";
import { saveGeneratedEdital, toggleTopicCompleted } from "@/app/actions";
import { useRouter } from "next/navigation";

export function EditalVerticalizado({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  const hasEdital = initialData && initialData.length > 0;

  const handleGenerate = async () => {
    if (!syllabusText || syllabusText.length < 50) {
      alert("Cole um conteúdo programático com pelo menos 50 caracteres.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar edital com IA.");

      // Salvar no banco
      const saveRes = await saveGeneratedEdital(json.data);
      if (!saveRes.success) throw new Error(saveRes.error);

      // Recarregar a página para buscar os dados iniciais do banco
      router.refresh();
    } catch (error: any) {
      console.error(error);
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
    // Otimista: atualiza UI via refresh, mas idealmente teria estado local
    await toggleTopicCompleted(topicId, newStatus);
    router.refresh();
  };

  if (!hasEdital) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-2">
          <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2"><Wand2 size={18} /> Edital Mágico (IA)</h4>
          <p className="text-sm text-amber-200/80 mb-4">
            Cole abaixo o texto do "Conteúdo Programático" do seu edital. Nossa IA vai ler, extrair todas as disciplinas, criar a lista de tópicos e estimar a carga horária automaticamente para você.
          </p>
          <textarea 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-amber-500 min-h-[150px]"
            placeholder="Ex: LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos. 2 Tipologia textual... DIREITO CONSTITUCIONAL: 1 Constituição: conceito, classificações..."
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || syllabusText.length < 50}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {isGenerating ? "A IA está processando seu edital..." : "Gerar Edital Inteligente"}
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
    <div className="space-y-4">
      {/* Progresso Geral */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400 font-medium">Progresso do Edital</span>
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
