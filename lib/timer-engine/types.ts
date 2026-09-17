export interface TimerRuntimeState {
  running: boolean;
  startEpochMs: number | null;
  accumulatedMs: number;
}

export function createInitialRuntimeState(): TimerRuntimeState {
  return { running: false, startEpochMs: null, accumulatedMs: 0 };
}
