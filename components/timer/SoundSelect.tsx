"use client";

import { Volume2 } from "lucide-react";
import { playAlert, unlockAudio, type SoundOption } from "@/lib/sounds/beep";

const OPTIONS: { value: SoundOption; label: string }[] = [
  { value: "silencio", label: "🔇 Silêncio" },
  { value: "suave", label: "🔔 Som: Suave" },
  { value: "despertador", label: "⏰ Som: Despertador (Loop)" },
  { value: "forte", label: "🚨 Som: Alerta Forte" },
];

interface SoundSelectProps {
  value: SoundOption;
  onChange: (value: SoundOption) => void;
}

export function SoundSelect({ value, onChange }: SoundSelectProps) {
  function handleChange(next: SoundOption) {
    unlockAudio();
    onChange(next);
    if (next !== "silencio") {
      playAlert(next, 2000);
    }
  }

  function handleTestSound() {
    unlockAudio();
    if (value === "silencio") {
      playAlert("suave", 2000);
    } else {
      playAlert(value, 2000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value as SoundOption)}
        className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleTestSound}
        className="flex items-center gap-1 rounded-lg border border-app-border bg-app-surface hover:border-accent px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        title="Testar som do alarme"
      >
        <Volume2 size={14} /> Testar
      </button>
    </div>
  );
}
