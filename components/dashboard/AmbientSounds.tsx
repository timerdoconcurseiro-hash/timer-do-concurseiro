"use client";

import React, { useState, useRef, useEffect } from "react";
import { Headphones, CloudRain, Wind, Coffee, Volume2 } from "lucide-react";

const SOUNDS = [
  { id: 'lofi', name: 'Lo-Fi Beats', icon: Headphones, url: 'https://play.streamafrica.net/lofiradio' },
  { id: 'rain', name: 'Chuva Suave', icon: CloudRain, url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
  { id: 'library', name: 'Biblioteca', icon: BookOpenIcon, url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc86214edc.mp3' },
  { id: 'cafe', name: 'Café Parisiense', icon: Coffee, url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'whitenoise', name: 'Ruído Branco', icon: Wind, url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3' },
];

function BookOpenIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
}

export function AmbientSounds() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializa o elemento de áudio (invisível) apenas uma vez
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true; // Para os sons de chuva e café repetirem
    }

    return () => {
      // Cleanup quando o componente for desmontado
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (activeSound) {
      const soundData = SOUNDS.find(s => s.id === activeSound);
      if (soundData) {
        // Se já estiver tocando o mesmo áudio, não recarrega
        if (audioRef.current.src !== soundData.url) {
          audioRef.current.src = soundData.url;
        }
        audioRef.current.volume = volume / 100;
        audioRef.current.play().catch(e => console.log("Erro no autoplay:", e));
      }
    } else {
      audioRef.current.pause();
    }
  }, [activeSound, volume]);

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  }

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
              <span className="text-xs font-medium text-center">{sound.name}</span>
            </button>
          );
        })}
      </div>

      {activeSound && (
        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <Volume2 size={16} className="text-slate-400 shrink-0" />
          <input 
            type="range" 
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
          />
        </div>
      )}
    </div>
  );
}
