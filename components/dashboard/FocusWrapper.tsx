"use client";

import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Card com "Modo Foco" (tela cheia).
 * A árvore de elementos é a MESMA nos dois modos (só as classes mudam),
 * assim o conteúdo NÃO é desmontado ao alternar — sons continuam tocando,
 * resultados da IA e formulários não são perdidos.
 */
export function FocusWrapper({
  children,
  title,
  id,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  id?: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <section
      id={id}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#090C15] flex flex-col p-6 md:p-12 overflow-y-auto"
          : "scroll-mt-6 bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 transition-colors hover:border-amber-500/20 relative group"
      }
    >
      <div className={isFullscreen ? "max-w-5xl mx-auto w-full" : ""}>
        <div
          className={
            isFullscreen
              ? "flex items-center justify-between mb-8 pb-4 border-b border-slate-800"
              : "flex items-center justify-between mb-6"
          }
        >
          <h3
            className={
              isFullscreen
                ? "text-2xl font-bold text-slate-200 flex items-center gap-3"
                : "text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2"
            }
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className={
              isFullscreen
                ? "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors font-medium text-sm"
                : "text-slate-500 hover:text-amber-400 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all p-1.5 rounded-md hover:bg-amber-500/10"
            }
            title={isFullscreen ? "Sair do Modo Foco (Esc)" : "Modo Foco (Tela Cheia)"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={16} /> Sair do Modo Foco
              </>
            ) : (
              <Maximize2 size={16} />
            )}
          </button>
        </div>
        <div
          className={
            isFullscreen
              ? "bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-8 shadow-2xl"
              : ""
          }
        >
          {children}
        </div>
      </div>
    </section>
  );
}
