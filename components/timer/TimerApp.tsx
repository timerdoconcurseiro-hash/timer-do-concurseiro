"use client";

import { useEffect, useState } from "react";
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
  }, []);

  // Proteção na Montagem das Abas (Tab Navigation)
  // Garante que ao mudar de aba, os temporizadores sempre iniciem limpos
  useEffect(() => {
    try {
      window.localStorage.removeItem("timer:pomodoro");
      window.localStorage.removeItem("timer:stopwatch");
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [tab]);

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

    // Sync to Supabase in the background
    saveStudySession({
      subject: session.subject,
      mode: session.mode,
      netSeconds: session.netSeconds,
      grossSeconds: session.netSeconds, // simplified for now
      startedAt: session.startedAt,
      finishedAt: session.endedAt
    }).catch(() => {});

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
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-10">
      <GoalProgress
        netSecondsToday={netSecondsToday}
        goalMinutes={goalMinutes}
        streakDays={streakDays}
        onChangeGoal={handleGoalChange}
      />

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

      <div className="flex w-full justify-center">
        {tab === "temporizador" && (
          <PomodoroPanel
            soundOption={sound}
            isVip={isVip}
            onSessionComplete={handleSaveSession}
          />
        )}
        {tab === "cronometro" && (
          <StopwatchPanel onSessionSaved={handleSaveSession} />
        )}
        {tab === "historico" && (
          <HistoryPanel sessions={sessions} onClearAll={handleClearAll} />
        )}
      </div>

      <GoalAchievedModal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
      />
    </div>
  );
}
