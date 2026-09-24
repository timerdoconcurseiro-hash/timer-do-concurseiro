import { getNetSecondsForDate, toDateKey, type StudySession } from "./sessions";

const GOAL_KEY = "tc:dailyGoalMinutes";
const STREAK_KEY = "tc:streak";
const DEFAULT_GOAL_MINUTES = 240; // 4h, mesmo padrão do site atual

export function getDailyGoalMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_GOAL_MINUTES;
  const raw = window.localStorage.getItem(GOAL_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GOAL_MINUTES;
}

export function setDailyGoalMinutes(minutes: number) {
  try {
    window.localStorage.setItem(GOAL_KEY, String(minutes));
  } catch {
    // Quota exceeded — silently ignore
  }
}

export interface StreakState {
  current: number;
  longest: number;
  lastMetDate: string | null;
}

function loadStreak(): StreakState {
  if (typeof window === "undefined") {
    return { current: 0, longest: 0, lastMetDate: null };
  }
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, longest: 0, lastMetDate: null };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { current: 0, longest: 0, lastMetDate: null };
  }
}

function saveStreak(streak: StreakState) {
  try {
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    // Quota exceeded or stringify failure — silently ignore
  }
}

export function getStreak(): StreakState {
  return loadStreak();
}

function isYesterday(dateKey: string, todayKey: string): boolean {
  const today = new Date(todayKey);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey === toDateKey(yesterday);
}

/**
 * Recalcula o streak após salvar uma sessão. Retorna `justMet: true` quando
 * esta sessão foi a responsável por bater a meta do dia agora (usado para
 * disparar o modal de "Meta Alcançada" só uma vez por dia).
 */
export function updateStreakAfterSession(
  sessionsBefore: StudySession[],
  sessionsAfter: StudySession[],
  goalMinutes: number,
  now: Date = new Date(),
): { streak: StreakState; justMet: boolean } {
  const goalSeconds = goalMinutes * 60;
  const todayKey = toDateKey(now);
  const totalBefore = getNetSecondsForDate(sessionsBefore, now);
  const totalAfter = getNetSecondsForDate(sessionsAfter, now);

  const metBefore = totalBefore >= goalSeconds;
  const metAfter = totalAfter >= goalSeconds;
  const justMet = !metBefore && metAfter;

  if (!justMet) {
    return { streak: loadStreak(), justMet: false };
  }

  const streak = loadStreak();
  let current: number;
  if (streak.lastMetDate === todayKey) {
    current = streak.current;
  } else if (streak.lastMetDate && isYesterday(streak.lastMetDate, todayKey)) {
    current = streak.current + 1;
  } else {
    current = 1;
  }

  const updated: StreakState = {
    current,
    longest: Math.max(streak.longest, current),
    lastMetDate: todayKey,
  };
  saveStreak(updated);
  return { streak: updated, justMet: true };
}
