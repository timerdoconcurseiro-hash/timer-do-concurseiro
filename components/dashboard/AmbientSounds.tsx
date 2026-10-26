"use client";

import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Wind, Cloud, Waves, Volume2, Square } from "lucide-react";

const SOUNDS = [
  { id: "binaural_focus", name: "Foco (Gamma 40Hz)", icon: BrainCircuit, type: "binaural", base: 400, diff: 40 },
  { id: "binaural_relax", name: "Leitura (Alpha 10Hz)", icon: BrainCircuit, type: "binaural", base: 300, diff: 10 },
  { id: "binaural_flow", name: "Fluxo (Theta 4Hz)", icon: Waves, type: "binaural", base: 250, diff: 4 },
  { id: "binaural_deep", name: "Zenn (Delta 2Hz)", icon: Cloud, type: "binaural", base: 200, diff: 2 },
  { id: "green_noise", name: "Ruído Verde (Água)", icon: Wind, type: "noise", color: "green" },
];

export function AmbientSounds() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);

  const stopAll = () => {
    sourceNodesRef.current.forEach((node) => {
      try {
        (node as any).stop?.();
      } catch {
        // ignore
      }
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    });
    sourceNodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  };

  const initAudio = async () => {
    stopAll();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx: AudioContext = new AudioContextClass();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.15;
    gain.connect(ctx.destination);
    gainRef.current = gain;
    return { ctx, gain };
  };

  const playBinaural = async (base: number, diff: number) => {
    const audio = await initAudio();
    if (!audio) return;
    const { ctx, gain } = audio;
    const merger = ctx.createChannelMerger(2);

    const left = ctx.createOscillator();
    left.type = "sine";
    left.frequency.value = base;
    left.connect(merger, 0, 0);
    left.start();

    const right = ctx.createOscillator();
    right.type = "sine";
    right.frequency.value = base + diff;
    right.connect(merger, 0, 1);
    right.start();

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    merger.connect(filter);
    filter.connect(gain);

    sourceNodesRef.current = [left, right, merger, filter];
  };

  const playNoise = async () => {
    const audio = await initAudio();
    if (!audio) return;
    const { ctx, gain } = audio;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 0.5;

    noise.connect(filter);
    filter.connect(gain);
    noise.start();

    sourceNodesRef.current = [noise, filter];
  };

  const handleSelectSound = async (soundId: string) => {
    if (activeSound === soundId) {
      stopAll();
      setActiveSound(null);
      return;
    }

    setActiveSound(soundId);
    const soundData = SOUNDS.find((s) => s.id === soundId);
    if (!soundData) return;

    if (soundData.type === "binaural") {
      await playBinaural(soundData.base!, soundData.diff!);
    } else if (soundData.type === "noise") {
      await playNoise();
    }
  };

  useEffect(() => {
    return () => stopAll();
  }, []);

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setVolume(val);
    if (gainRef.current) gainRef.current.gain.value = (val / 100) * 0.15;
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
              type="button"
              onClick={() => handleSelectSound(sound.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon size={24} className={`mb-2 ${isActive ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium text-center">{sound.name}</span>
            </button>
          );
        })}
      </div>

      {activeSound && (
        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center gap-3 border border-slate-800">
          <Volume2 size={16} className="text-amber-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-xs text-slate-400 w-9 text-right">{volume}%</span>
          <button
            type="button"
            onClick={() => {
              stopAll();
              setActiveSound(null);
            }}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Parar áudio"
          >
            <Square size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
