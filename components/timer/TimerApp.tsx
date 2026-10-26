"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PomodoroPanel } from "./PomodoroPanel";
import { StopwatchPanel } from "./StopwatchPanel";
import { SoundSelect } from "./SoundSelect";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { GoalAchievedModal } from "@/components/goals/GoalAchievedModal";
import {
  addSession,
  clearSessions,
  getNetSecondsForDate,
  getSessions,
  type StudySession,
} from "@/lib/storage/sessions";
import {
  dequeueSessionSync,
  enqueueSessionSync,
  loadSyncQueue,
  type QueuedSessionPayload,
} from "@/lib/storage/sync-queue";
import {
  getDailyGoalMinutes,
  getStreak,
  setDailyGoalMinutes,
  updateStreakAfterSession,
} from "@/lib/storage/goals";
import type { SoundOption } from "@/lib/sounds/beep";
import { saveStudySession } from "@/app/actions";

type Tab = "temporizador" | "cronometro" | "historico";

const SOUND_KEY = "tc:soundOption";

export function TimerApp({ isVip = false }: { isVip?: boolean }) {
  const [tab, setTab] = useState<Tab>("temporizador");
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goalMinutes, setGoalMinutes] = useState(240);
  const [streakDays, setStreakDays] = useState(0);
  const [sound, setSound] = useState<SoundOption>("suave");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [syncBadge, setSyncBadge] = useState<"idle" | "syncing" | "saved" | "pending">("idle");
  const flushingRef = useRef(false);

  const flushSyncQueue = useCallback(async () => {
    if (flushingRef.current) return;
    const queue = loadSyncQueue();
    if (queue.length === 0) return;

    flushingRef.current = true;
    setSyncBadge("syncing");
    try {
      for (const item of queue) {
        const res = await saveStudySession(item);
        if (res.success) {
          dequeueSessionSync(item.clientSessionId);
        } else if ((res as { unauthenticated?: boolean }).unauthenticated) {
          // Usuário anônimo: mantém na fila caso faça login depois, sem mostrar erro
          setSyncBadge("idle");
          flushingRef.current = false;
          return;
        } else {
          setSyncBadge("pending");
          flushingRef.current = false;
          return;
        }
      }
      setSyncBadge("saved");
      setTimeout(() => setSyncBadge("idle"), 2500);
    } catch {
      setSyncBadge("pending");
    } finally {
      flushingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setSessions(getSessions());
    setGoalMinutes(getDailyGoalMinutes());
    setStreakDays(getStreak().current);
    try {
      const savedSound = window.localStorage.getItem(SOUND_KEY) as SoundOption | null;
      if (savedSound) setSound(savedSound);
    } catch {
      // localStorage unavailable — use default sound
    }
    setHydrated(true);
    flushSyncQueue();

    const onOnline = () => flushSyncQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushSyncQueue]);

  function handleSoundChange(value: SoundOption) {
    setSound(value);
    try {
      window.localStorage.setItem(SOUND_KEY, value);
    } catch {
      // Quota exceeded — silently ignore
    }
  }

  function handleGoalChange(minutes: number) {
    setGoalMinutes(minutes);
    setDailyGoalMinutes(minutes);
  }

  async function handleSaveSession(session: Omit<StudySession, "id">) {
    if (!session || session.netSeconds <= 0) return;

    const before = sessions;
    const saved = addSession(session);
    const after = [...before, saved];
    setSessions(after);

    const parenMatch = session.subject.match(/^(.+?)\s*\((.+)\)$/);
    const cleanSubject = parenMatch ? parenMatch[1].trim() : session.subject;
    const cleanTopic = parenMatch ? parenMatch[2].trim() : undefined;

    const payload: QueuedSessionPayload = {
      clientSessionId: saved.id,
      subject: cleanSubject,
      topic: cleanTopic,
      mode: session.mode,
      netSeconds: session.netSeconds,
      grossSeconds: session.netSeconds,
      startedAt: session.startedAt,
      finishedAt: session.endedAt,
      editalTopicId: session.topicId ?? null,
    };

    enqueueSessionSync(payload);
    flushSyncQueue();

    const { streak, justMet } = updateStreakAfterSession(
      before,
      after,
      goalMinutes,
    );
    setStreakDays(streak.current);
    if (justMet) setShowGoalModal(true);
  }

  function handleClearAll() {
    clearSessions();
    setSessions([]);
  }

  if (!hydrated) return null;

  const netSecondsToday = getNetSecondsForDate(sessions, new Date());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
      <GoalProgress
        netSecondsToday={netSecondsToday}
        goalMinutes={goalMinutes}
        streakDays={streakDays}
        onChangeGoal={handleGoalChange}
      />

      {syncBadge !== "idle" && (
        <div
          role="status"
          className={`text-xs px-3 py-1 rounded-full border transition-all ${
            syncBadge === "saved"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : syncBadge === "syncing"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {syncBadge === "saved" && "✓ Sincronizado na nuvem"}
          {syncBadge === "syncing" && "Sincronizando sessão..."}
          {syncBadge === "pending" && "Salvo no dispositivo (sincronizará quando online)"}
        </div>
      )}

      <nav className="flex gap-1 rounded-2xl border border-app-border bg-app-surface p-1">
        {(
          [
            ["temporizador", "Temporizador"],
            ["cronometro", "Cronômetro"],
            ["historico", "Histórico"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === value
                ? "bg-accent/15 text-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab !== "historico" && (
        <SoundSelect value={sound} onChange={handleSoundChange} />
      )}

      <div className="flex w-full justify-center flex-grow">
        <div className={`w-full ${tab === "temporizador" ? "block" : "hidden"}`}>
          <PomodoroPanel
            soundOption={sound}
            isVip={isVip}
            isActiveTab={tab === "temporizador"}
            onSessionComplete={handleSaveSession}
          />
        </div>
        <div className={`w-full ${tab === "cronometro" ? "block" : "hidden"}`}>
          <StopwatchPanel
            soundOption={sound}
            isActiveTab={tab === "cronometro"}
            onSessionSaved={handleSaveSession}
          />
        </div>
        <div className={`w-full ${tab === "historico" ? "block" : "hidden"}`}>
          <HistoryPanel sessions={sessions} onClearAll={handleClearAll} />
        </div>
      </div>

      <GoalAchievedModal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
      />
    </div>
  );
}
