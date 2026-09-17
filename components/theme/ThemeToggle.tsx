"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme/constants";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

const CONFIG: Record<ThemePreference, { icon: string; label: string }> = {
  system: { icon: "🖥️", label: "Sistema" },
  light: { icon: "☀️", label: "Claro" },
  dark: { icon: "🌙", label: "Escuro" },
};

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Leitura única do localStorage (fonte externa) ao montar, só no client
    // — necessário para evitar mismatch de hidratação (SSR não tem acesso
    // ao localStorage do usuário).
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light" || stored === "dark") setPref(stored);
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(next);
    if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  // Evita mismatch de hidratação: só sabemos a preferência salva no client.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden
        className="rounded-full border border-app-border px-3 py-1.5 text-sm text-text-secondary opacity-0"
      >
        Tema
      </button>
    );
  }

  const { icon, label } = CONFIG[pref];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Tema: ${label} (clique para alternar)`}
      className="rounded-full border border-app-border px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-strong hover:text-text-primary"
    >
      {icon} {label}
    </button>
  );
}
