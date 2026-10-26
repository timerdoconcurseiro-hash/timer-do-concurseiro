"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  elapsedMs as computeElapsedMs,
  pause as enginePause,
  reset as engineReset,
  start as engineStart,
} from "./engine";
import { createInitialRuntimeState, type TimerRuntimeState } from "./types";

/**
 * Carrega o estado de execução do timer preservando `running: true` caso
 * a página seja recarregada ou reaberta. Como `startEpochMs` é um timestamp
 * absoluto, `computeElapsedMs` calcula exatamente o tempo que passou enquanto
 * a aba esteve fechada ou em segundo plano.
 */
function loadRuntime(storageKey: string): TimerRuntimeState {
  if (typeof window === "undefined") return createInitialRuntimeState();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createInitialRuntimeState();
    const parsed = JSON.parse(raw) as Partial<TimerRuntimeState>;
    const accumulatedMs =
      typeof parsed.accumulatedMs === "number" && parsed.accumulatedMs >= 0
        ? parsed.accumulatedMs
        : 0;
    const running = Boolean(parsed.running) && typeof parsed.startEpochMs === "number";
    return {
      running,
      startEpochMs: running ? (parsed.startEpochMs as number) : null,
      accumulatedMs,
    };
  } catch {
    return createInitialRuntimeState();
  }
}

function saveRuntime(storageKey: string, state: TimerRuntimeState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Quota exceeded or stringify failure — silently ignore
  }
}

export function useTimerEngine(storageKey: string, targetDurationMs?: number) {
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
      if (event.data.type === "tick" || event.data.type === "alarm") {
        forceTick();
      }
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    saveRuntime(storageKey, runtime);
    if (runtime.running) {
      workerRef.current?.postMessage({
        type: "start",
        targetDurationMs,
        currentElapsedMs: computeElapsedMs(runtime),
      });
    } else {
      workerRef.current?.postMessage({ type: "stop" });
    }
  }, [runtime, storageKey, targetDurationMs]);

  // Atualiza imediatamente ao voltar para a aba e sincroniza entre múltiplas abas
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") forceTick();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === storageKey) {
        setRuntime(loadRuntime(storageKey));
        forceTick();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey]);

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
