"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, ChevronRight, CheckCircle2 } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  topic?: string;
}

export function FlashcardModal({ isOpen, onClose, subject, topic }: FlashcardModalProps) {
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setFlashcards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setError("");

      fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setFlashcards(data.flashcards);
      })
      .catch(err => {
        setError(err.message || "Erro ao gerar flashcards.");
      })
      .finally(() => setLoading(false));
    }
  }, [isOpen, subject, topic]);

  if (!isOpen) return null;

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // Concluiu
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 mb-6">
          <Sparkles size={20} />
          <h3 className="font-semibold text-lg">Revisão Imediata (IA)</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Sparkles className="animate-pulse mb-4 text-indigo-500" size={32} />
            <p>A IA do Gemini está gerando flashcards de {subject}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-amber-400">
            <p>{error}</p>
            <p className="text-sm mt-2 opacity-70">Verifique sua chave GEMINI_API_KEY no painel da Vercel.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
              Flashcard {currentIndex + 1} de {flashcards.length}
            </div>

            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[200px] bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 transition-all duration-300 transform perspective-1000"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-lg font-medium text-white transition-all">
                {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-4 mb-6">
              Toque no card para virar e ver a resposta.
            </p>

            {isFlipped && (
              <button 
                onClick={nextCard}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {currentIndex < flashcards.length - 1 ? (
                  <>Próximo <ChevronRight size={18} /></>
                ) : (
                  <>Concluir Revisão <CheckCircle2 size={18} /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
