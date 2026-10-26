export type SoundOption = "silencio" | "suave" | "despertador" | "forte";

const AUDIO_FILES: Record<Exclude<SoundOption, "silencio">, string> = {
  suave: "/audio/Suave.mp3",
  forte: "/audio/Alerta.mp3",
  despertador: "/audio/Loop.mp3",
};

const audioInstances: Record<string, HTMLAudioElement> = {};
let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let synthInterval: ReturnType<typeof setInterval> | null = null;
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function ensureAudioElement(option: Exclude<SoundOption, "silencio">): HTMLAudioElement {
  if (!audioInstances[option]) {
    const el = new Audio(AUDIO_FILES[option]);
    el.preload = "auto";
    audioInstances[option] = el;
  }
  return audioInstances[option];
}

/**
 * Desbloqueia tanto os elementos HTMLAudio quanto o Web Audio API
 * na primeira interação do usuário (clique em Iniciar ou troca de som).
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;

  // 1. Prepara e faz preload dos arquivos MP3
  (["suave", "forte", "despertador"] as const).forEach((key) => {
    const audio = ensureAudioElement(key);
    audio.load();
  });

  // 2. Desbloqueia o AudioContext do navegador com um pulso inaudível
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    }
  } catch {
    // ignore
  }
}

export function stopAlert() {
  if (typeof window === "undefined") return;
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  if (synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
  }
  Object.values(audioInstances).forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  });
}

/**
 * Fallback via Web Audio API caso o navegador bloqueie o elemento <audio>
 * ou o arquivo MP3 não carregue.
 */
function playWebAudioFallback(option: Exclude<SoundOption, "silencio">, durationMs: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const triggerTone = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (option === "suave") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(528, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (option === "despertador") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // forte
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.setValueAtTime(987.77, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // ignore
    }
  };

  triggerTone();
  if (durationMs > 900) {
    synthInterval = setInterval(triggerTone, 900);
    stopTimeout = setTimeout(() => {
      stopAlert();
    }, durationMs);
  }
}

export function playAlert(option: SoundOption, durationMs = 6000) {
  if (option === "silencio" || typeof window === "undefined") return;

  try {
    stopAlert();

    const audio = ensureAudioElement(option);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.9;
    audio.loop = durationMs > 2500;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Se o MP3 falhar ou for bloqueado, toca o sintetizador Web Audio
        playWebAudioFallback(option, durationMs);
      });
    }

    stopTimeout = setTimeout(() => {
      stopAlert();
    }, durationMs);
  } catch {
    playWebAudioFallback(option, durationMs);
  }
}
