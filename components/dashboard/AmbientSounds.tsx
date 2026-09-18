"use client";

import React, { useState, useRef, useEffect } from "react";
import { Headphones, CloudRain, Wind, Coffee, Volume2, BrainCircuit } from "lucide-react";

const SOUNDS = [
  { id: 'binaural_focus', name: 'Foco (Gamma 40Hz)', icon: BrainCircuit, type: 'binaural', baseFreq: 400, diffFreq: 40 },
  { id: 'binaural_relax', name: 'Leitura (Alpha 10Hz)', icon: BrainCircuit, type: 'binaural', baseFreq: 300, diffFreq: 10 },
  { id: 'rain', name: 'Chuva Suave', icon: CloudRain, type: 'url', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
  { id: 'cafe', name: 'Café Parisiense', icon: Coffee, type: 'url', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'whitenoise', name: 'Ruído Branco', icon: Wind, type: 'url', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3' },
];

export function AmbientSounds() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  
  // Player de Áudio normal (MP3)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Sintetizador Binaural (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopBinaural();
    };
  }, []);

  const stopBinaural = () => {
    if (oscLeftRef.current) {
      try { oscLeftRef.current.stop(); } catch(e){}
      oscLeftRef.current.disconnect();
      oscLeftRef.current = null;
    }
    if (oscRightRef.current) {
      try { oscRightRef.current.stop(); } catch(e){}
      oscRightRef.current.disconnect();
      oscRightRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const playBinaural = (baseFreq: number, diffFreq: number) => {
    stopBinaural(); // Limpa estado anterior
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const merger = ctx.createChannelMerger(2);
    const gainNode = ctx.createGain();
    gainNodeRef.current = gainNode;
    
    // Configura o volume inicial do sintetizador (Binaural costuma ser alto, usamos 10% da escala)
    gainNode.gain.value = (volume / 100) * 0.1;

    merger.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Oscilador Esquerdo
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = baseFreq;
    oscLeft.connect(merger, 0, 0); // Conecta no canal 0 (Esquerdo)
    oscLeft.start();
    oscLeftRef.current = oscLeft;

    // Oscilador Direito
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = baseFreq + diffFreq;
    oscRight.connect(merger, 0, 1); // Conecta no canal 1 (Direito)
    oscRight.start();
    oscRightRef.current = oscRight;
  };

  useEffect(() => {
    // Parar todos
    if (audioRef.current) audioRef.current.pause();
    stopBinaural();

    if (activeSound) {
      const soundData = SOUNDS.find(s => s.id === activeSound);
      if (soundData) {
        if (soundData.type === 'url') {
          if (audioRef.current && audioRef.current.src !== soundData.url) {
            audioRef.current.src = soundData.url!;
          }
          if (audioRef.current) {
            audioRef.current.volume = volume / 100;
            audioRef.current.play().catch(e => console.log("Erro no autoplay:", e));
          }
        } else if (soundData.type === 'binaural') {
          playBinaural(soundData.baseFreq!, soundData.diffFreq!);
        }
      }
    }
  }, [activeSound]);

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setVolume(val);
    
    if (audioRef.current && activeSound && SOUNDS.find(s => s.id === activeSound)?.type === 'url') {
      audioRef.current.volume = val / 100;
    }
    if (gainNodeRef.current && activeSound && SOUNDS.find(s => s.id === activeSound)?.type === 'binaural') {
      gainNodeRef.current.gain.value = (val / 100) * 0.1;
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {SOUNDS.map((sound) => {
          const Icon = sound.icon;
          const isActive = activeSound === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => setActiveSound(isActive ? null : sound.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300
                ${isActive 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
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
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" 
          />
        </div>
      )}
    </div>
  );
}
