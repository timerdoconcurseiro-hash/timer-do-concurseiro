export type SoundOption = "silencio" | "suave" | "despertador" | "forte";

const audioInstances: Record<string, HTMLAudioElement> = {};

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!audioInstances["suave"]) {
    audioInstances["suave"] = new Audio("/sounds/Suave.mp3");
    audioInstances["forte"] = new Audio("/sounds/Alerta.mp3");
    audioInstances["despertador"] = new Audio("/sounds/Loop.mp3");

    // Desbloqueia as instâncias reproduzindo com volume zero
    Object.values(audioInstances).forEach((audio) => {
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.8;
      }).catch(() => {});
    });
  }
}

export function playAlert(option: SoundOption) {
  if (option === "silencio" || typeof window === "undefined") return;

  try {
    const audio = audioInstances[option];
    if (!audio) {
      // Fallback
      let newAudio: HTMLAudioElement;
      if (option === "suave") newAudio = new Audio("/sounds/Suave.mp3");
      else if (option === "forte") newAudio = new Audio("/sounds/Alerta.mp3");
      else if (option === "despertador") newAudio = new Audio("/sounds/Loop.mp3");
      else return;
      newAudio.volume = 0.8;
      newAudio.play().catch((err) => console.log("Erro ao tocar áudio:", err));
      return;
    }

    // Para qualquer execução anterior e reinicia
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play().catch((err) => console.log("Erro ao tocar áudio:", err));
  } catch (error) {
    console.error("Erro ao disparar áudio:", error);
  }
}
