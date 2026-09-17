import type { TimerRuntimeState } from "./types";

/**
 * Fonte de verdade = timestamp absoluto. O tempo decorrido é sempre
 * recalculado a partir de startEpochMs, nunca por incremento de contador —
 * assim o timer não perde precisão quando a aba fica em background e os
 * ticks do worker são atrasados/pulados pelo navegador.
 */
export function elapsedMs(
  state: TimerRuntimeState,
  nowMs: number = Date.now(),
): number {
  if (!state.running || state.startEpochMs === null) {
    return state.accumulatedMs;
  }
  return state.accumulatedMs + (nowMs - state.startEpochMs);
}

export function remainingMs(
  durationMs: number,
  state: TimerRuntimeState,
  nowMs: number = Date.now(),
): number {
  return Math.max(0, durationMs - elapsedMs(state, nowMs));
}

export function isComplete(
  durationMs: number,
  state: TimerRuntimeState,
  nowMs: number = Date.now(),
): boolean {
  return elapsedMs(state, nowMs) >= durationMs;
}

export function start(
  state: TimerRuntimeState,
  nowMs: number = Date.now(),
): TimerRuntimeState {
  if (state.running) return state;
  return { ...state, running: true, startEpochMs: nowMs };
}

export function pause(
  state: TimerRuntimeState,
  nowMs: number = Date.now(),
): TimerRuntimeState {
  if (!state.running) return state;
  return {
    running: false,
    startEpochMs: null,
    accumulatedMs: elapsedMs(state, nowMs),
  };
}

export function reset(): TimerRuntimeState {
  return { running: false, startEpochMs: null, accumulatedMs: 0 };
}

export function formatHms(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
