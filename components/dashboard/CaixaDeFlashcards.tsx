"use client";

import React, { useState, useEffect } from "react";
import { Book, Edit2, Trash2, Play, Check, Plus, X, ListChecks, ChevronUp } from "lucide-react";
import { FlashcardViewer } from "./FlashcardViewer";
import { type Deck, loadDecks, saveDecks, addDeck, DECKS_EVENT } from "@/lib/storage/decks";

function formatRelative(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export function CaixaDeFlashcards() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAnnotation, setEditAnnotation] = useState("");

  const [managingId, setManagingId] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [creating, setCreating] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");

  const [studyingDeck, setStudyingDeck] = useState<Deck | null>(null);
  const [studyingInitialIndex, setStudyingInitialIndex] = useState(0);

  useEffect(() => {
    const refresh = () => setDecks(loadDecks());
    refresh();
    window.addEventListener(DECKS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DECKS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const persist = (newDecks: Deck[]) => {
    setDecks(newDecks);
    if (!saveDecks(newDecks)) alert("Não foi possível salvar (armazenamento do navegador cheio).");
  };

  const updateDeck = (id: number, patch: Partial<Deck>) => {
    persist(decks.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleCreateDeck = () => {
    const title = newDeckTitle.trim();
    if (!title) return;
    const deck = addDeck({ titulo: title, anotacao: "", cards: [] });
    setDecks(loadDecks());
    setNewDeckTitle("");
    setCreating(false);
    setManagingId(deck.id);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja apagar este Deck?")) {
      persist(decks.filter((d) => d.id !== id));
    }
  };

  const handleEdit = (deck: Deck) => {
    setEditingId(deck.id);
    setEditTitle(deck.titulo);
    setEditAnnotation(deck.anotacao || "");
  };

  const handleSaveEdit = (id: number) => {
    updateDeck(id, { titulo: editTitle.trim() || "Deck sem título", anotacao: editAnnotation });
    setEditingId(null);
  };

  const handleAddCard = (deck: Deck) => {
    const q = newQuestion.trim();
    const a = newAnswer.trim();
    if (!q || !a) return;
    updateDeck(deck.id, { cards: [...deck.cards, { question: q, answer: a }] });
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleRemoveCard = (deck: Deck, index: number) => {
    updateDeck(deck.id, { cards: deck.cards.filter((_, i) => i !== index) });
  };

  const handleFinishStudy = (deckId: number, result: { correct: number; total: number }) => {
    // Lê do storage para não sobrescrever alterações feitas em paralelo
    const current = loadDecks();
    persist(
      current.map((d) =>
        d.id === deckId ? { ...d, lastStudiedAt: new Date().toISOString(), lastScore: result } : d
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Criar deck manual */}
      {creating ? (
        <div className="bg-slate-900/60 border border-fuchsia-500/30 rounded-xl p-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateDeck();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Nome do deck (ex: Lei 8.112)"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none"
          />
          <button
            type="button"
            onClick={handleCreateDeck}
            disabled={!newDeckTitle.trim()}
            className="px-3 rounded-lg bg-fuchsia-500 text-white disabled:opacity-40"
            title="Criar"
          >
            <Check size={16} />
          </button>
          <button type="button" onClick={() => setCreating(false)} className="px-3 rounded-lg bg-slate-800 text-slate-300" title="Cancelar">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-fuchsia-300 hover:border-fuchsia-500/50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} /> Criar deck manualmente
        </button>
      )}

      {decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Book size={40} className="text-amber-400 mb-4 opacity-50" />
          <h4 className="text-slate-200 font-medium mb-2">Caixa Vazia</h4>
          <p className="text-slate-400 text-sm">
            Crie um deck acima ou gere flashcards automaticamente na Sala de Leitura IA.
          </p>
        </div>
      )}

      {decks.map((deck) => {
        const isManaging = managingId === deck.id;
        return (
          <div key={deck.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col relative group">
            {editingId === deck.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none"
                  placeholder="Título do Deck"
                />
                <textarea
                  value={editAnnotation}
                  onChange={(e) => setEditAnnotation(e.target.value)}
                  className="w-full h-16 bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:border-amber-500 outline-none resize-none"
                  placeholder="Anotação (opcional)"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(deck.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Check size={16} /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h4 className="font-bold text-slate-200 break-words">{deck.titulo}</h4>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" onClick={() => handleEdit(deck)} className="text-slate-400 hover:text-amber-400 p-1" title="Editar título/anotação">
                      <Edit2 size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(deck.id)} className="text-slate-400 hover:text-red-400 p-1" title="Apagar deck">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {deck.anotacao && <p className="text-slate-400 text-sm mb-3 italic">{deck.anotacao}</p>}

                {deck.lastScore && (
                  <p className="text-xs text-slate-500 mb-2">
                    Último estudo {formatRelative(deck.lastStudiedAt)} •{" "}
                    <span className="text-emerald-400 font-semibold">
                      {deck.lastScore.correct}/{deck.lastScore.total} acertos
                    </span>
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={() => setManagingId(isManaging ? null : deck.id)}
                    className="text-xs text-slate-400 hover:text-fuchsia-300 font-medium flex items-center gap-1"
                  >
                    {isManaging ? <ChevronUp size={14} /> : <ListChecks size={14} />}
                    {deck.cards.length} cards {isManaging ? "" : "• gerenciar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudyingInitialIndex(0);
                      setStudyingDeck(deck);
                    }}
                    disabled={deck.cards.length === 0}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play size={14} /> Estudar em Modo Foco
                  </button>
                </div>

                {isManaging && (
                  <div className="mt-3 space-y-2">
                    {deck.cards.map((card, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setStudyingInitialIndex(i);
                          setStudyingDeck(deck);
                        }}
                        className="flex gap-2 items-center justify-between bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-lg p-2.5 cursor-pointer transition-colors"
                        title="Clique para abrir este card em Modo Foco"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            <span className="text-amber-400 mr-1.5">#{i + 1}</span>
                            {card.question}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{card.answer}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(deck, i);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                          title="Remover card"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Pergunta"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-fuchsia-500 outline-none"
                      />
                      <textarea
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Resposta"
                        className="w-full h-16 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-fuchsia-500 outline-none resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCard(deck)}
                        disabled={!newQuestion.trim() || !newAnswer.trim()}
                        className="w-full py-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/30 disabled:opacity-40 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Adicionar card
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {studyingDeck && (
        <FlashcardViewer
          cards={studyingDeck.cards}
          title={studyingDeck.titulo}
          initialIndex={studyingInitialIndex}
          onClose={() => setStudyingDeck(null)}
          onFinish={(result) => handleFinishStudy(studyingDeck.id, result)}
        />
      )}
    </div>
  );
}
