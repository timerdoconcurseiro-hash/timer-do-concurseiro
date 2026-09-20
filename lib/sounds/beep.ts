export type SoundOption = "silencio" | "suave" | "despertador" | "forte";

const audioInstances: Record<string, HTMLAudioElement> = {};
let stopTimeout: NodeJS.Timeout | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!audioInstances["suave"]) {
    audioInstances["suave"] = new Audio("/audio/Suave.mp3");
    audioInstances["forte"] = new Audio("/audio/Alerta.mp3");
    audioInstances["despertador"] = new Audio("/audio/Loop.mp3");

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

export function stopAlert() {
  if (typeof window === "undefined") return;
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  Object.values(audioInstances).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export function playAlert(option: SoundOption) {
  if (option === "silencio" || typeof window === "undefined") return;

  try {
    stopAlert(); // Para qualquer áudio tocando e reseta o timeout

    const audio = audioInstances[option];
    if (!audio) {
      // Fallback
      let newAudio: HTMLAudioElement;
    if (option === "suave") newAudio = new Audio("/audio/Suave.mp3");
      else if (option === "forte") newAudio = new Audio("/audio/Alerta.mp3");
      else if (option === "despertador") newAudio = new Audio("/audio/Loop.mp3");
      else return;
      newAudio.volume = 0.8;
      newAudio.loop = true;
      newAudio.play().catch((err) => console.log("Erro ao tocar áudio:", err));
      
      stopTimeout = setTimeout(() => {
        newAudio.pause();
        newAudio.currentTime = 0;
      }, 6000);
      return;
    }

    // Para qualquer execução anterior e reinicia
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.loop = true;
    audio.play().catch((err) => console.log("Erro ao tocar áudio:", err));

    // Desliga automaticamente após 6 segundos
    stopTimeout = setTimeout(() => {
      stopAlert();
    }, 6000);
  } catch (error) {
    console.error("Erro ao disparar áudio:", error);
  }
}
