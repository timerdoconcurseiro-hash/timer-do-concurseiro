"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw, X } from "lucide-react";

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  title: string;
  onClose: () => void;
}

export function FlashcardViewer({ cards, title, onClose }: FlashcardViewerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors z-[60]"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-emerald-400 mb-8 text-center px-12">
          {title} - Card {currentCardIndex + 1}/{cards.length}
        </h2>

        <div className="w-full aspect-[4/3] md:aspect-video perspective-[1000px] mb-8">
          <div
            className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] cursor-pointer"
            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front (Question) */}
            <div className="flip-card-front bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl flex flex-col" style={{ height: "100%" }}>
              <div className="shrink-0 p-4 pb-0">
                <h3 className="text-slate-400 uppercase tracking-widest text-sm font-semibold text-center">Pergunta</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-white text-center break-words" style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}>
                  {cards[currentCardIndex].question}
                </p>
              </div>

              <div className="mt-auto shrink-0 min-h-[60px] z-10 p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-b-xl">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  disabled={currentCardIndex === 0}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button className="flex items-center gap-2 text-slate-400 font-medium">
                  <RotateCw size={18} /> Virar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  disabled={currentCardIndex === cards.length - 1}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Back (Answer) */}
            <div className="flip-card-back bg-emerald-900 border-2 border-emerald-600 rounded-2xl shadow-2xl flex flex-col" style={{ height: "100%" }}>
              <div className="shrink-0 p-4 pb-0">
                <h3 className="text-emerald-300 uppercase tracking-widest text-sm font-semibold text-center">Resposta</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-white text-center break-words whitespace-pre-wrap" style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}>
                  {cards[currentCardIndex].answer}
                </p>
              </div>

              <div className="mt-auto shrink-0 min-h-[60px] z-10 p-4 border-t border-emerald-800/50 flex items-center justify-between bg-emerald-900/50 rounded-b-xl">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  disabled={currentCardIndex === 0}
                  className="p-3 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button className="flex items-center gap-2 text-emerald-300 font-medium">
                  <RotateCw size={18} /> Virar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  disabled={currentCardIndex === cards.length - 1}
                  className="p-3 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
