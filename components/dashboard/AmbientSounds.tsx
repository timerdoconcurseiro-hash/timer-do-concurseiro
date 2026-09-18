"use client";

import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Wind, Cloud, Waves, Volume2 } from "lucide-react";

const SOUNDS = [
  { id: 'binaural_focus', name: 'Foco (Gamma 40Hz)', icon: BrainCircuit, type: 'binaural', base: 400, diff: 40 },
  { id: 'binaural_relax', name: 'Leitura (Alpha 10Hz)', icon: BrainCircuit, type: 'binaural', base: 300, diff: 10 },
  { id: 'white_noise', name: 'Ruído Branco', icon: Wind, type: 'noise', color: 'white' },
  { id: 'brown_noise', name: 'Ruído Marrom', icon: Cloud, type: 'noise', color: 'brown' },
  { id: 'pink_noise', name: 'Ruído Rosa', icon: Waves, type: 'noise', color: 'pink' },
];

export function AmbientSounds() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);

  const stopAll = () => {
    sourceNodesRef.current.forEach(node => {
      try { (node as any).stop(); } catch(e){}
      node.disconnect();
    });
    sourceNodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  };

  const initAudio = () => {
    stopAll();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    // Ruídos e binaurais gerados programaticamente precisam ter ganho bem reduzido
    gain.gain.value = (volume / 100) * 0.1;
    gain.connect(ctx.destination);
    gainRef.current = gain;
    return { ctx, gain };
  };

  const playBinaural = (base: number, diff: number) => {
    const audio = initAudio();
    if (!audio) return;
    const { ctx, gain } = audio;
    const merger = ctx.createChannelMerger(2);
    merger.connect(gain);

    const left = ctx.createOscillator();
    left.type = 'sine'; left.frequency.value = base;
    left.connect(merger, 0, 0); left.start();

    const right = ctx.createOscillator();
    right.type = 'sine'; right.frequency.value = base + diff;
    right.connect(merger, 0, 1); right.start();

    sourceNodesRef.current = [left, right, merger];
  };

  const playNoise = (color: string) => {
    const audio = initAudio();
    if (!audio) return;
    const { ctx, gain } = audio;
    const bufferSize = ctx.sampleRate * 2; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        output[i] = white;
      } else if (color === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
      } else if (color === 'pink') {
        // aproximação simples de pink noise
        output[i] = (lastOut + (0.05 * white)) / 1.05;
        lastOut = output[i];
        output[i] *= 2.0;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(gain);
    noise.start();
    sourceNodesRef.current = [noise];
  };

  useEffect(() => {
    stopAll();
    const soundData = SOUNDS.find(s => s.id === activeSound);
    if (!soundData) return;

    if (soundData.type === 'binaural') {
      playBinaural(soundData.base!, soundData.diff!);
    } else if (soundData.type === 'noise') {
      playNoise(soundData.color!);
    }
    
    return () => stopAll();
  }, [activeSound]);

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setVolume(val);
    if (gainRef.current) gainRef.current.gain.value = (val / 100) * 0.1;
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
        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center gap-3 border border-slate-800">
          <Volume2 size={16} className="text-slate-400 shrink-0" />
          <input 
            type="range" 
            min="0" max="100" value={volume} onChange={handleVolumeChange}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" 
          />
        </div>
      )}
    </div>
  );
}
