"use client";

import React, { useState } from "react";
import { Headphones, CloudRain, Wind, Coffee, Volume2 } from "lucide-react";

const SOUNDS = [
  { id: 'lofi', name: 'Lo-Fi Beats', icon: Headphones },
  { id: 'rain', name: 'Chuva Suave', icon: CloudRain },
  { id: 'library', name: 'Biblioteca', icon: BookOpenIcon },
  { id: 'cafe', name: 'Café Parisiense', icon: Coffee },
  { id: 'whitenoise', name: 'Ruído Branco', icon: Wind },
];

function BookOpenIcon(props: any) {
  // Just a simple placeholder to avoid extra imports if BookOpen isn't available
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
}

export function AmbientSounds() {
  const [activeSound, setActiveSound] = useState<string | null>('lofi');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {SOUNDS.map((sound) => {
          const Icon = sound.icon;
          const isActive = activeSound === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => setActiveSound(isActive ? null : sound.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300
                ${isActive 
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <Icon size={24} className="mb-2" />
              <span className="text-xs font-medium">{sound.name}</span>
            </button>
          );
        })}
      </div>

      {activeSound && (
        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center gap-3 border border-slate-800">
          <Volume2 size={16} className="text-slate-400" />
          <input 
            type="range" 
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            defaultValue={50}
          />
        </div>
      )}
    </div>
  );
}
