"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RotateCw, X, Check, XCircle, Trophy, RefreshCcw, Shuffle } from "lucide-react";

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  title: string;
  onClose: () => void;
  /** Índice inicial ao abrir o modo foco */
  initialIndex?: number;
  /** Chamado ao final de uma rodada de estudo com o nº de acertos/total */
  onFinish?: (result: { correct: number; total: number }) => void;
}

type Answer = "right" | "wrong";

export function FlashcardViewer({
  cards,
  title,
  onClose,
  initialIndex = 0,
  onFinish,
}: FlashcardViewerProps) {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentCardIndex, setCurrentCardIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max((cards?.length || 1) - 1, 0))
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [finished, setFinished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Garante foco no overlay para capturar teclas imediatamente
  useEffect(() => {
    if (mounted) {
      containerRef.current?.focus();
    }
  }, [mounted]);

  const total = deck.length;
  const correct = Object.values(answers).filter((a) => a === "right").length;
  const wrongCards = deck.filter((_, i) => answers[i] === "wrong");

  const goTo = useCallback(
    (index: number) => {
      setIsFlipped(false);
      setCurrentCardIndex(Math.min(Math.max(index, 0), Math.max(total - 1, 0)));
    },
    [total]
  );

  const finishRound = useCallback(
    (finalAnswers: Record<number, Answer>) => {
      setFinished(true);
      const c = Object.values(finalAnswers).filter((a) => a === "right").length;
      onFinish?.({ correct: c, total });
    },
    [onFinish, total]
  );

  const handleAnswer = useCallback(
    (answer: Answer) => {
      const next = { ...answers, [currentCardIndex]: answer };
      setAnswers(next);
      if (currentCardIndex < total - 1) {
        goTo(currentCardIndex + 1);
      } else {
        finishRound(next);
      }
    },
    [answers, currentCardIndex, total, goTo, finishRound]
  );

  const restart = (newDeck: Flashcard[]) => {
    setDeck(newDeck);
    setAnswers({});
    setFinished(false);
    setIsFlipped(false);
    setCurrentCardIndex(0);
  };

  const shuffle = () => {
    const copy = [...deck];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    restart(copy);
  };

  // Atalhos de teclado: Esc (captura prioritária), ← → navegar, Espaço virar, 1 errei, 2 acertei
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (finished) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(currentCardIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentCardIndex - 1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped && e.key === "1") {
        e.preventDefault();
        handleAnswer("wrong");
      } else if (isFlipped && e.key === "2") {
        e.preventDefault();
        handleAnswer("right");
      }
    };

    // Usa capture: true para que o Esc feche o FlashcardViewer antes de qualquer FocusWrapper pai
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, finished, currentCardIndex, isFlipped, goTo, handleAnswer]);

  // Bloqueia o scroll da página enquanto o modo foco estiver aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!cards || cards.length === 0 || !mounted) return null;

  const card = deck[currentCardIndex] || deck[0];

  const content = (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Modo Foco - ${title}`}
      className="fixed inset-0 z-[300] bg-[#070A12]/98 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-10 outline-none select-none overflow-y-auto"
      onClick={onClose}
    >
      {/* Top Bar do Modo Foco */}
      <div
        className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block">
            Modo Foco • Flashcards
          </span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!finished && (
            <>
              <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs sm:text-sm font-semibold text-emerald-400">
                Card {currentCardIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={shuffle}
                className="p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Embaralhar cards"
              >
                <Shuffle size={18} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition-colors text-xs sm:text-sm font-semibold border border-slate-700"
            title="Sair do Modo Foco (Esc)"
          >
            <X size={18} />
            <span className="hidden sm:inline">Sair (Esc)</span>
          </button>
        </div>
      </div>

      {/* Área Central */}
      <div
        className="w-full max-w-4xl mx-auto my-auto py-4 flex flex-col items-center justify-center flex-1"
        onClick={(e) => e.stopPropagation()}
      >
        {finished ? (
          <div className="w-full bg-slate-900/90 border border-slate-700 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
            <Trophy size={56} className="mx-auto text-amber-400" />
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Sessão de Flashcards Concluída!</h3>
              <p className="text-slate-400 mt-1 text-base">{title}</p>
            </div>
            <div className="text-5xl md:text-6xl font-bold text-emerald-400">
              {correct}/{total}
              <span className="block text-sm md:text-base font-medium text-slate-400 mt-2">
                {total > 0 ? Math.round((correct / total) * 100) : 0}% de aproveitamento nesta rodada
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {wrongCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => restart(wrongCards)}
                  className="px-6 py-3.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={18} /> Revisar as {wrongCards.length} que errei
                </button>
              )}
              <button
                type="button"
                onClick={() => restart(cards)}
                className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold flex items-center justify-center gap-2"
              >
                <RotateCw size={18} /> Recomeçar deck
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-900 hover:bg-emerald-400 font-bold"
              >
                Fechar (Esc)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de progresso */}
            <div className="w-full h-2 bg-slate-800/80 rounded-full mb-6 overflow-hidden flex gap-0.5 p-0.5">
              {deck.map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-full transition-colors ${
                    answers[i] === "right"
                      ? "bg-emerald-500"
                      : answers[i] === "wrong"
                        ? "bg-red-500"
                        : i === currentCardIndex
                          ? "bg-amber-400"
                          : "bg-transparent"
                  }`}
                />
              ))}
            </div>

            {/* Card Amplo e Legível (Modo Foco) */}
            <div
              onClick={() => setIsFlipped((f) => !f)}
              className={`w-full min-h-[340px] sm:min-h-[400px] md:min-h-[440px] max-h-[68vh] rounded-3xl border-2 shadow-2xl flex flex-col justify-between p-6 sm:p-8 md:p-12 cursor-pointer transition-all duration-300 ${
                isFlipped
                  ? "bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.15)]"
                  : "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-slate-700/80 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 shrink-0 pb-4 border-b border-slate-800/80">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    isFlipped
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {isFlipped ? "Resposta / Gabarito" : "Pergunta"}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <RotateCw size={13} /> Clique no cartão ou aperte Espaço para virar
                </span>
              </div>

              <div className="flex-1 overflow-y-auto my-6 pr-2 flex items-center justify-center">
                <p className="text-slate-100 text-center leading-relaxed break-words whitespace-pre-wrap font-normal text-lg sm:text-xl md:text-2xl max-w-3xl select-text">
                  {isFlipped ? card.answer : card.question}
                </p>
              </div>

              <div className="shrink-0 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Use ← → para navegar</span>
                <span>Aperte Esc para sair</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rodapé de Controles */}
      {!finished && (
        <div
          className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 pt-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => goTo(currentCardIndex - 1)}
            disabled={currentCardIndex === 0}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Anterior (←)"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {isFlipped ? (
            <div className="flex gap-3 flex-1 justify-center max-w-md">
              <button
                type="button"
                onClick={() => handleAnswer("wrong")}
                className="flex-1 py-3.5 px-4 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 font-bold flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
                title="Atalho: tecla 1"
              >
                <XCircle size={18} /> Errei
              </button>
              <button
                type="button"
                onClick={() => handleAnswer("right")}
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-500 text-slate-900 hover:bg-emerald-400 font-bold flex items-center justify-center gap-2 text-sm sm:text-base transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                title="Atalho: tecla 2"
              >
                <Check size={18} /> Acertei
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="flex-1 max-w-xs py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 text-sm sm:text-base transition-colors shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              <RotateCw size={18} /> Mostrar Resposta
            </button>
          )}

          <button
            type="button"
            onClick={() => goTo(currentCardIndex + 1)}
            disabled={currentCardIndex === total - 1}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Próximo (→)"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
