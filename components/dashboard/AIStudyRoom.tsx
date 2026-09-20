"use client";

import React, { useState, useEffect } from "react";
import { Brain, FileText, Send, Loader2, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { saveAIFlashcards, getLastStudySession } from "@/app/actions";
import { useRouter } from "next/navigation";

export function AIStudyRoom() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [result, setResult] = useState<{ summary: string[]; flashcards: { question: string; answer: string }[] } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Focus Mode state
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [lastSession, setLastSession] = useState<{ subject: string; topic: string } | null>(null);

  useEffect(() => {
    getLastStudySession().then(data => {
      if (data) {
        setLastSession(data);
      }
    });
  }, []);

  const handleGenerate = async () => {
    if (text.length < 50) {
      alert("Cole um texto maior para a IA analisar.");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setIsSaved(false);

    const maxRetries = 2;

    const executeFetch = async (currentAttempt: number) => {
      try {
        const payloadContext = {
          texto: text,
          disciplina: lastSession?.subject || subject,
          assunto_complemento: lastSession?.topic || ""
        };

        const res = await fetch("/api/ai/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textContext: payloadContext })
        });

        if (!res.ok) {
          if ((res.status === 503 || res.status === 429) && currentAttempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (currentAttempt + 1)));
            return executeFetch(currentAttempt + 1);
          }
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Erro ${res.status}`);
        }

        const json = await res.json();
        setResult(json.data);
      } catch (err: any) {
        if (currentAttempt < maxRetries && err.message.includes("Failed to fetch")) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (currentAttempt + 1)));
          return executeFetch(currentAttempt + 1);
        }
        alert("Nossa IA está com alta demanda neste segundo. Por favor, aguarde alguns instantes e tente gerar o flashcard novamente.");
      }
    };

    await executeFetch(0);
    setIsProcessing(false);
  };

  const handleSaveFlashcards = async () => {
    if (!result) return;
    try {
      const res = await saveAIFlashcards(result.flashcards, subject);
      if (!res.success) throw new Error(res.error);
      setIsSaved(true);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const openFocusMode = (index: number) => {
    setCurrentCardIndex(index);
    setIsFlipped(false);
    setFocusModeOpen(true);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (result && currentCardIndex < result.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/50">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <FileText size={18} className="text-amber-400" />
          Material de Estudo
        </h4>
        <input 
          type="text" 
          placeholder="Matéria (ex: Direito Administrativo)" 
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-white mb-3 focus:border-amber-500 outline-none transition-colors"
        />
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o trecho da apostila, PDF ou lei seca que você está lendo agora..."
          className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-amber-500 outline-none transition-colors resize-none mb-4"
        />
        <button 
          onClick={handleGenerate}
          disabled={isProcessing || text.length < 50}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
          {isProcessing ? "Lendo material e criando flashcards..." : "Analisar com Inteligência Artificial"}
        </button>
      </div>

      {result && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-6 rounded-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div>
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Resumo Focado
            </h4>
            <ul className="space-y-2">
              {result.summary.map((point, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span> 
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          <div>
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
              <Brain size={18} /> Flashcards Gerados ({result.flashcards.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {result.flashcards.map((card, i) => (
                <button 
                  key={i} 
                  onClick={() => openFocusMode(i)}
                  className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 transition-all text-left group"
                >
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400">
                    <span className="text-emerald-500 mr-2">Q{i + 1}.</span> 
                    {card.question.substring(0, 60)}{card.question.length > 60 ? '...' : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Clique para Modo Foco</p>
                </button>
              ))}
            </div>

            <button 
              onClick={handleSaveFlashcards}
              disabled={isSaved}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                isSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
              }`}
            >
              {isSaved ? (
                <><CheckCircle2 size={18} /> Enviados para o Smart Cycle!</>
              ) : (
                <><Send size={18} /> Enviar Flashcards para o Meu Ciclo de Revisão</>
              )}
            </button>
          </div>

        </div>
      )}

      {focusModeOpen && result && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl flex flex-col items-center">
            <button 
              onClick={() => setFocusModeOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-emerald-400 mb-8">Modo Foco - Flashcard {currentCardIndex + 1}/{result.flashcards.length}</h2>

            <div className="w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 mb-8">
              <div 
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front (Question) */}
                <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-700 rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl">
                  <h3 className="text-slate-400 mb-4 uppercase tracking-widest text-sm font-semibold">Pergunta</h3>
                  <p className="text-white text-center" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', wordWrap: 'break-word', overflowY: 'auto' }}>
                    {result.flashcards[currentCardIndex].question}
                  </p>
                  <p className="absolute bottom-6 text-slate-500 text-sm animate-pulse">Clique para Virar</p>
                </div>

                {/* Back (Answer) */}
                <div className="absolute inset-0 backface-hidden bg-emerald-900 border-2 border-emerald-600 rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl rotate-y-180">
                  <h3 className="text-emerald-300 mb-4 uppercase tracking-widest text-sm font-semibold">Resposta</h3>
                  <p className="text-white text-center" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', wordWrap: 'break-word', overflowY: 'auto' }}>
                    {result.flashcards[currentCardIndex].answer}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full justify-between">
              <button 
                onClick={handlePrev}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                <ChevronLeft size={20} /> Anterior
              </button>
              <button 
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 max-w-[200px] px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg transition-colors text-center"
              >
                Virar
              </button>
              <button 
                onClick={handleNext}
                disabled={currentCardIndex === result.flashcards.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Próximo <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
