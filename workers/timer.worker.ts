let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (
  event: MessageEvent<{ type: "start" | "stop"; intervalMs?: number }>,
) => {
  const { type, intervalMs } = event.data;

  if (type === "start") {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = setInterval(() => {
      self.postMessage({ type: "tick" });
    }, intervalMs ?? 250);
  } else if (type === "stop") {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};

export {};
