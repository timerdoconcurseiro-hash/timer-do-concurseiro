"use client";

import type { SoundOption } from "@/lib/sounds/beep";

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
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SoundOption)}
      className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
