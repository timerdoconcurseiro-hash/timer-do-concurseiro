"use client";

import React, { useState } from "react";
import { BookOpen, Clock, Target, CheckCircle2, Loader2, Sparkles, X, ChevronLeft, ChevronRight, RotateCw, Brain } from "lucide-react";
import { markReviewCompleted } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SmartCycle({ reviews }: { reviews: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Flashcard Runner State
  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleComplete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLoadingId(id);
    await markReviewCompleted(id);
    router.refresh();
    setLoadingId(null);
    // If completing in focus mode, we might want to go next
    if (focusMode && currentIndex < reviews.length - 1) {
      handleNext();
    } else if (focusMode && currentIndex === reviews.length - 1) {
      setFocusMode(false);
    }
  };

  const openFocusMode = (index: number) => {
    setCurrentIndex(index);
    setFlipped(false);
    setFocusMode(true);
  };

  const handleNext = () => {
    if (currentIndex < reviews.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles size={40} className="text-fuchsia-400 mb-4 opacity-50" />
        <h4 className="text-slate-200 font-medium mb-2">Tudo em dia!</h4>
        <p className="text-slate-400 text-sm mb-4">
          Você não tem revisões agendadas para hoje. Continue estudando novas matérias para o algoritmo trabalhar!
        </p>
        <Link 
          href="/timer" 
          className="px-4 py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          Ir para o Timer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.map((item, index) => {
          const today = new Date().toISOString().split('T')[0];
          const isLate = item.review_date < today;

          return (
            <div 
              key={item.id}
              onClick={() => openFocusMode(index)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col group hover:border-fuchsia-500/50 transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(217,70,239,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={40} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-fuchsia-400 bg-fuchsia-400/10 p-1.5 rounded-md">
                  <Target size={14} />
                </div>
                <h4 className="font-bold text-slate-200 text-sm truncate pr-8">{item.subject}</h4>
              </div>
              
              <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
                {item.topic ? item.topic : 'Revisão Geral'}
              </p>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  {isLate && <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Atrasada</span>}
                  <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} /> SM-2
                  </span>
                </div>
                <button 
                  onClick={(e) => handleComplete(item.id, e)}
                  disabled={loadingId === item.id}
                  className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors p-1"
                  title="Marcar como feito sem revisar"
                >
                  {loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Focus Mode Modal */}
      {focusMode && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="bg-fuchsia-500/20 text-fuchsia-400 p-2 rounded-xl">
                <Brain size={20} className="lucide lucide-brain" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Modo Foco: Revisão</h2>
                <p className="text-sm text-slate-400">Card {currentIndex + 1} de {reviews.length}</p>
              </div>
            </div>
            <button 
              onClick={() => setFocusMode(false)}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Flashcard Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto perspective-[1000px]">
            <div 
              onClick={() => setFlipped(!flipped)}
              className="relative w-full max-w-2xl aspect-[4/3] md:aspect-video cursor-pointer [transform-style:preserve-3d] transition-all duration-500 ease-out"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Frente - Pergunta */}
              <div className="flip-card-front bg-slate-900 border-2 border-slate-700 hover:border-fuchsia-500/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col transition-colors">
                <div className="text-fuchsia-400/50 font-bold uppercase tracking-widest text-sm mb-4 text-center">Pergunta</div>
                
                <div className="card-text-container custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="font-medium text-slate-200 leading-tight text-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                    {reviews[currentIndex].topic || 'Qual é o conceito geral de ' + reviews[currentIndex].subject + '?'}
                  </p>
                </div>

                <div className="card-actions flex items-center justify-between w-full" style={{ marginTop: 'auto', minHeight: '60px', zIndex: 10 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={currentIndex === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <RotateCw size={16} /> Virar
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={currentIndex === reviews.length - 1}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Verso - Resposta */}
              <div className="flip-card-back bg-gradient-to-br from-fuchsia-900/40 to-slate-900 border-2 border-fuchsia-500/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col transition-colors">
                <div className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm mb-4 text-center">Resposta</div>
                
                <div className="card-text-container custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-fuchsia-50 leading-relaxed max-w-2xl whitespace-pre-wrap text-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                    {reviews[currentIndex].notes || 'Tente relembrar os principais pontos estudados sobre esta matéria.'}
                  </p>
                </div>

                <div className="card-actions flex items-center justify-between w-full" style={{ marginTop: 'auto', minHeight: '60px', zIndex: 10 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={currentIndex === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button 
                    onClick={(e) => handleComplete(reviews[currentIndex].id, e)}
                    disabled={loadingId === reviews[currentIndex].id}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                  >
                    {loadingId === reviews[currentIndex].id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Lembrei!
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={currentIndex === reviews.length - 1}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Controles de Navegação (Dots) */}
            <div className="flex items-center justify-center mt-8">
              <div className="flex gap-2">
                {reviews.map((_, idx) => (
                  <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-fuchsia-500' : 'w-2 bg-slate-700'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
