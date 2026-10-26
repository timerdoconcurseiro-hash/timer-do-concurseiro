/**
 * Fila persistente no localStorage para sincronização garantida de sessões
 * de estudo com o Supabase (suporte offline + retentativa automática).
 */

export interface QueuedSessionPayload {
  clientSessionId: string;
  subject: string;
  topic?: string;
  mode: string;
  netSeconds: number;
  grossSeconds: number;
  startedAt: string;
  finishedAt: string;
  editalTopicId?: string | null;
}

const SYNC_QUEUE_KEY = "tc:syncQueue:v1";

export function loadSyncQueue(): QueuedSessionPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedSessionPayload[]) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(items: QueuedSessionPayload[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function enqueueSessionSync(item: QueuedSessionPayload) {
  const current = loadSyncQueue();
  if (current.some((x) => x.clientSessionId === item.clientSessionId)) return;
  saveSyncQueue([...current, item]);
}

export function dequeueSessionSync(clientSessionId: string) {
  const current = loadSyncQueue();
  saveSyncQueue(current.filter((x) => x.clientSessionId !== clientSessionId));
}
