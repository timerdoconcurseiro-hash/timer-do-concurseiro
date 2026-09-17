"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  elapsedMs as computeElapsedMs,
  pause as enginePause,
  reset as engineReset,
  start as engineStart,
} from "./engine";
import { createInitialRuntimeState, type TimerRuntimeState } from "./types";

function loadRuntime(storageKey: string): TimerRuntimeState {
  if (typeof window === "undefined") return createInitialRuntimeState();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createInitialRuntimeState();
    const parsed = JSON.parse(raw) as TimerRuntimeState;
    // Se estava "rodando" antes de recarregar a página, converte o tempo
    // decorrido até agora em acumulado e mantém pausado — evita duplo timer.
    if (parsed.running && parsed.startEpochMs !== null) {
      return {
        running: false,
        startEpochMs: null,
        accumulatedMs: computeElapsedMs(parsed),
      };
    }
    return parsed;
  } catch {
    return createInitialRuntimeState();
  }
}

function saveRuntime(storageKey: string, state: TimerRuntimeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function useTimerEngine(storageKey: string) {
  const [runtime, setRuntime] = useState<TimerRuntimeState>(() =>
    loadRuntime(storageKey),
  );
  const [, forceTick] = useReducer((c: number) => c + 1, 0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../../workers/timer.worker.ts", import.meta.url),
    );
    worker.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type === "tick") forceTick();
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    saveRuntime(storageKey, runtime);
    if (runtime.running) {
      workerRef.current?.postMessage({ type: "start" });
    } else {
      workerRef.current?.postMessage({ type: "stop" });
    }
  }, [runtime, storageKey]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") forceTick();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const start = useCallback(() => setRuntime((r) => engineStart(r)), []);
  const pause = useCallback(() => setRuntime((r) => enginePause(r)), []);
  const reset = useCallback(() => setRuntime(() => engineReset()), []);

  return {
    runtime,
    elapsedMs: computeElapsedMs(runtime),
    start,
    pause,
    reset,
  };
}
