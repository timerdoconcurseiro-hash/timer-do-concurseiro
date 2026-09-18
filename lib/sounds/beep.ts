export type SoundOption = "silencio" | "suave" | "despertador" | "forte";

export function playAlert(option: SoundOption) {
  if (option === "silencio" || typeof window === "undefined") return;

  try {
    let audio: HTMLAudioElement;

    if (option === "suave") {
      audio = new Audio("/sounds/Suave.mp3");
    } else if (option === "forte") {
      audio = new Audio("/sounds/Alerta.mp3");
    } else if (option === "despertador") {
      audio = new Audio("/sounds/Loop.mp3");
    } else {
      return;
    }

    audio.volume = 0.8;
    audio.play().catch((err) => console.log("Erro ao tocar áudio:", err));
  } catch (error) {
    console.error("Erro ao instanciar áudio:", error);
  }
}
