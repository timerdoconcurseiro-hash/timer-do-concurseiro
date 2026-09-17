import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatHms } from "../timer-engine/engine";
import type { StudySession } from "../storage/sessions";

export function buildHistoryPdf(sessions: StudySession[]): jsPDF {
  const doc = new jsPDF();
  doc.text("Histórico — Timer do Concurseiro", 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [["Matéria", "Modo", "Horas líquidas", "Início", "Fim"]],
    body: sessions.map((s) => [
      s.subject,
      s.mode === "pomodoro" ? "Temporizador" : "Cronômetro",
      formatHms(s.netSeconds),
      new Date(s.startedAt).toLocaleString("pt-BR"),
      new Date(s.endedAt).toLocaleString("pt-BR"),
    ]),
  });
  return doc;
}

export function downloadHistoryPdf(
  sessions: StudySession[],
  filename = "historico-timer-do-concurseiro.pdf",
) {
  buildHistoryPdf(sessions).save(filename);
}
