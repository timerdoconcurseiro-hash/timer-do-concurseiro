let intervalId: ReturnType<typeof setInterval> | null = null;
let alarmTimeoutId: ReturnType<typeof setTimeout> | null = null;

type WorkerCommand =
  | { type: "start"; intervalMs?: number; targetDurationMs?: number; currentElapsedMs?: number }
  | { type: "stop" };

function clearTimers() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (alarmTimeoutId !== null) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const data = event.data;

  if (data.type === "start") {
    clearTimers();
    intervalId = setInterval(() => {
      self.postMessage({ type: "tick" });
    }, data.intervalMs ?? 250);

    if (
      typeof data.targetDurationMs === "number" &&
      data.targetDurationMs > 0 &&
      typeof data.currentElapsedMs === "number"
    ) {
      const remaining = Math.max(0, data.targetDurationMs - data.currentElapsedMs);
      alarmTimeoutId = setTimeout(() => {
        self.postMessage({ type: "alarm" });
      }, remaining);
    }
  } else if (data.type === "stop") {
    clearTimers();
  }
};

export {};
