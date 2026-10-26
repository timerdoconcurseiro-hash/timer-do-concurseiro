/**
 * Contexto persistido das sessões do Timer (Pomodoro e Cronômetro).
 * Separado do TimerRuntimeState (que guarda apenas running/startEpochMs/accumulatedMs)
 * para permitir que recarregamentos, fechamentos de aba e sincronização entre abas
 * preservem matéria, complemento, tópico do edital e fila de blocos do Pomodoro.
 */

export interface PomodoroPreset {
  label: string;
  minutes: number;
  kind: "foco" | "pausa";
}

export interface PomodoroContextState {
  preset: PomodoroPreset;
  queue: PomodoroPreset[];
  isQueueMode: boolean;
  subjectCategory: string;
  customSubject: string;
  complement: string;
  topicId: string;
}

export interface StopwatchContextState {
  subjectCategory: string;
  customSubject: string;
  complement: string;
  topicId: string;
}

const POMODORO_CTX_KEY = "timer:v2:pomodoro:ctx";
const STOPWATCH_CTX_KEY = "timer:v2:stopwatch:ctx";

export const DEFAULT_POMODORO_PRESET: PomodoroPreset = {
  label: "25 min Foco",
  minutes: 25,
  kind: "foco",
};

export function createDefaultPomodoroContext(): PomodoroContextState {
  return {
    preset: DEFAULT_POMODORO_PRESET,
    queue: [],
    isQueueMode: false,
    subjectCategory: "",
    customSubject: "",
    complement: "",
    topicId: "",
  };
}

export function createDefaultStopwatchContext(): StopwatchContextState {
  return {
    subjectCategory: "",
    customSubject: "",
    complement: "",
    topicId: "",
  };
}

export function loadPomodoroContext(): PomodoroContextState {
  if (typeof window === "undefined") return createDefaultPomodoroContext();
  try {
    const raw = window.localStorage.getItem(POMODORO_CTX_KEY);
    if (!raw) return createDefaultPomodoroContext();
    const parsed = JSON.parse(raw) as Partial<PomodoroContextState>;
    const preset =
      parsed.preset &&
      typeof parsed.preset.minutes === "number" &&
      parsed.preset.minutes > 0 &&
      (parsed.preset.kind === "foco" || parsed.preset.kind === "pausa")
        ? parsed.preset
        : DEFAULT_POMODORO_PRESET;
    return {
      preset,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      isQueueMode: Boolean(parsed.isQueueMode),
      subjectCategory: typeof parsed.subjectCategory === "string" ? parsed.subjectCategory : "",
      customSubject: typeof parsed.customSubject === "string" ? parsed.customSubject : "",
      complement: typeof parsed.complement === "string" ? parsed.complement : "",
      topicId: typeof parsed.topicId === "string" ? parsed.topicId : "",
    };
  } catch {
    return createDefaultPomodoroContext();
  }
}

export function savePomodoroContext(ctx: PomodoroContextState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POMODORO_CTX_KEY, JSON.stringify(ctx));
  } catch {
    // ignore quota errors
  }
}

export function loadStopwatchContext(): StopwatchContextState {
  if (typeof window === "undefined") return createDefaultStopwatchContext();
  try {
    const raw = window.localStorage.getItem(STOPWATCH_CTX_KEY);
    if (!raw) return createDefaultStopwatchContext();
    const parsed = JSON.parse(raw) as Partial<StopwatchContextState>;
    return {
      subjectCategory: typeof parsed.subjectCategory === "string" ? parsed.subjectCategory : "",
      customSubject: typeof parsed.customSubject === "string" ? parsed.customSubject : "",
      complement: typeof parsed.complement === "string" ? parsed.complement : "",
      topicId: typeof parsed.topicId === "string" ? parsed.topicId : "",
    };
  } catch {
    return createDefaultStopwatchContext();
  }
}

export function saveStopwatchContext(ctx: StopwatchContextState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STOPWATCH_CTX_KEY, JSON.stringify(ctx));
  } catch {
    // ignore quota errors
  }
}
