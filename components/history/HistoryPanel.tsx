"use client";

import { formatHms } from "@/lib/timer-engine/engine";
import { downloadHistoryExcel } from "@/lib/export/exportExcel";
import { downloadHistoryPdf } from "@/lib/export/exportPdf";
import type { StudySession } from "@/lib/storage/sessions";

interface HistoryPanelProps {
  sessions: StudySession[];
  onClearAll: () => void;
}

export function HistoryPanel({ sessions, onClearAll }: HistoryPanelProps) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  function handleClearAll() {
    if (window.confirm("Apagar todo o histórico de sessões? Essa ação não pode ser desfeita.")) {
      onClearAll();
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadHistoryExcel(sessions)}
            disabled={sessions.length === 0}
            className="rounded-xl border border-app-border px-4 py-2 text-sm text-text-primary transition hover:border-accent disabled:opacity-40"
          >
            📥 Excel
          </button>
          <button
            type="button"
            onClick={() => downloadHistoryPdf(sessions)}
            disabled={sessions.length === 0}
            className="rounded-xl border border-app-border px-4 py-2 text-sm text-text-primary transition hover:border-accent disabled:opacity-40"
          >
            📄 PDF
          </button>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={sessions.length === 0}
          className="rounded-xl border border-app-border px-4 py-2 text-sm text-danger transition hover:border-danger disabled:opacity-40"
        >
          🗑️ Apagar Tudo
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-sm text-text-secondary">
          Nenhuma sessão registrada ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-app-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-surface text-text-secondary">
              <tr>
                <th className="px-4 py-2">Matéria</th>
                <th className="px-4 py-2">Modo</th>
                <th className="px-4 py-2">Horas líquidas</th>
                <th className="px-4 py-2">Início</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-t border-app-border">
                  <td className="px-4 py-2">{s.subject}</td>
                  <td className="px-4 py-2 text-text-secondary">
                    {s.mode === "pomodoro" ? "Temporizador" : "Cronômetro"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {formatHms(s.netSeconds)}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {new Date(s.startedAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
