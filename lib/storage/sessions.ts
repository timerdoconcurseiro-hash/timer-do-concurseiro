export interface StudySession {
  id: string;
  subject: string;
  mode: "pomodoro" | "stopwatch";
  netSeconds: number;
  startedAt: string;
  endedAt: string;
}

const KEY = "tc:sessions";

export function getSessions(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StudySession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: StudySession[]) {
  window.localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function addSession(session: Omit<StudySession, "id">): StudySession {
  const full: StudySession = { ...session, id: crypto.randomUUID() };
  const sessions = [...getSessions(), full];
  saveSessions(sessions);
  return full;
}

export function clearSessions() {
  saveSessions([]);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getNetSecondsForDate(
  sessions: StudySession[],
  date: Date,
): number {
  const key = toDateKey(date);
  return sessions
    .filter((s) => toDateKey(new Date(s.startedAt)) === key)
    .reduce((sum, s) => sum + s.netSeconds, 0);
}
