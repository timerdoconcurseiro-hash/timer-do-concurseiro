"use client";

import React, { useState, useEffect } from "react";
import { Brain, FileText, Send, Loader2, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { saveAIFlashcards, getLastStudySession } from "@/app/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { FlashcardViewer } from "./FlashcardViewer";

export function AIStudyRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSubject = searchParams.get('subject');
  const urlTopic = searchParams.get('topic');

  const [text, setText] = useState("");
  const [subject, setSubject] = useState(urlSubject ? `${urlSubject} - ${urlTopic || ''}`.replace(/ - $/, '') : "");
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
        setSubject(prev => prev || `${data.subject} - ${data.topic}`);
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
      const newDeck = {
        id: Date.now(),
        titulo: subject || "Novo Deck",
        anotacao: "",
        cards: result.flashcards
      };
      
      const stored = window.localStorage.getItem('@timer:savedDecks');
      const decks = stored ? JSON.parse(stored) : [];
      decks.push(newDeck);
      window.localStorage.setItem('@timer:savedDecks', JSON.stringify(decks));
      
      setIsSaved(true);
      window.dispatchEvent(new Event('savedDecksUpdated'));
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const openFocusMode = (index: number) => {
    setCurrentCardIndex(index);
    setFocusModeOpen(true);
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
                <><CheckCircle2 size={18} /> Deck salvo com sucesso!</>
              ) : (
                <><Send size={18} /> Salvar Meus Flashcards</>
              )}
            </button>
          </div>

        </div>
      )}

      {focusModeOpen && result && (
        <FlashcardViewer 
          cards={result.flashcards} 
          title="Pré-visualização" 
          onClose={() => setFocusModeOpen(false)} 
        />
      )}
    </div>
  );
}
