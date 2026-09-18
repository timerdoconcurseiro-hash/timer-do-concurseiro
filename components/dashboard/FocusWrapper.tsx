"use client";

import React, { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function FocusWrapper({ children, title }: { children: React.ReactNode, title: React.ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090C15] flex flex-col p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
              {title}
            </h2>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors font-medium text-sm"
            >
              <Minimize2 size={16} /> Sair do Modo Foco
            </button>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-8 shadow-2xl">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-7 backdrop-blur-sm transition-all hover:border-amber-500/20 relative group">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {title}
        </h3>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-amber-500/10"
          title="Modo Foco (Tela Cheia)"
        >
          <Maximize2 size={16} />
        </button>
      </div>
      {children}
    </section>
  );
}
