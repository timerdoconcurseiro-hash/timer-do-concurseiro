export type SoundOption = "silencio" | "suave" | "despertador" | "forte";

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  gain: number,
  delay = 0,
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gainNode.gain.value = gain;
  osc.connect(gainNode).connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/**
 * Sons sintetizados via Web Audio API — evita depender de arquivos de áudio
 * externos e funciona 100% offline. "Despertador" simula um loop curto de
 * alguns beeps em vez de tocar indefinidamente.
 */
export function playAlert(option: SoundOption) {
  if (option === "silencio" || typeof window === "undefined") return;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();

  if (option === "suave") {
    playTone(ctx, 660, 0.4, 0.15);
  } else if (option === "forte") {
    playTone(ctx, 880, 0.35, 0.35);
    playTone(ctx, 880, 0.35, 0.35, 0.45);
  } else if (option === "despertador") {
    for (let i = 0; i < 4; i++) {
      playTone(ctx, 740, 0.2, 0.25, i * 0.35);
    }
  }

  window.setTimeout(() => ctx.close(), 3000);
}
