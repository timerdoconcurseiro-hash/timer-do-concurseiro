import type { Flashcard } from "@/components/dashboard/FlashcardViewer";

export interface Deck {
  id: number;
  titulo: string;
  anotacao: string;
  cards: Flashcard[];
  createdAt?: string;
  lastStudiedAt?: string;
  lastScore?: { correct: number; total: number };
}

const KEY = "@timer:savedDecks";
export const DECKS_EVENT = "savedDecksUpdated";

export function loadDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && typeof d === "object")
      .map((d) => ({
        ...d,
        titulo: typeof d.titulo === "string" ? d.titulo : "Deck",
        anotacao: typeof d.anotacao === "string" ? d.anotacao : "",
        cards: Array.isArray(d.cards) ? d.cards : [],
      }));
  } catch {
    return [];
  }
}

export function saveDecks(decks: Deck[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(decks));
    window.dispatchEvent(new Event(DECKS_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function addDeck(deck: Omit<Deck, "id" | "createdAt">): Deck {
  const full: Deck = { ...deck, id: Date.now(), createdAt: new Date().toISOString() };
  saveDecks([full, ...loadDecks()]);
  return full;
}
