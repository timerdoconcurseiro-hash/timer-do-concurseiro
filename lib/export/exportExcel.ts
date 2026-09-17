import * as XLSX from "xlsx";
import { formatHms } from "../timer-engine/engine";
import type { StudySession } from "../storage/sessions";

export function buildHistoryRows(sessions: StudySession[]) {
  return sessions.map((s) => ({
    Matéria: s.subject,
    Modo: s.mode === "pomodoro" ? "Temporizador" : "Cronômetro",
    "Horas líquidas": formatHms(s.netSeconds),
    Início: new Date(s.startedAt).toLocaleString("pt-BR"),
    Fim: new Date(s.endedAt).toLocaleString("pt-BR"),
  }));
}

export function buildHistoryWorkbook(sessions: StudySession[]) {
  const worksheet = XLSX.utils.json_to_sheet(buildHistoryRows(sessions));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
  return workbook;
}

export function downloadHistoryExcel(
  sessions: StudySession[],
  filename = "historico-timer-do-concurseiro.xlsx",
) {
  XLSX.writeFile(buildHistoryWorkbook(sessions), filename);
}
