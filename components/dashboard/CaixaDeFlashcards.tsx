"use client";

import React, { useState, useEffect } from "react";
import { Book, Edit2, Trash2, Play, Check } from "lucide-react";
import { FlashcardViewer, Flashcard } from "./FlashcardViewer";

interface Deck {
  id: number;
  titulo: string;
  anotacao: string;
  cards: Flashcard[];
}

export function CaixaDeFlashcards() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAnnotation, setEditAnnotation] = useState("");
  
  const [studyingDeck, setStudyingDeck] = useState<Deck | null>(null);

  const loadDecks = () => {
    try {
      const stored = window.localStorage.getItem('@timer:savedDecks');
      if (stored) {
        setDecks(JSON.parse(stored));
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    loadDecks();
    window.addEventListener('savedDecksUpdated', loadDecks);
    return () => window.removeEventListener('savedDecksUpdated', loadDecks);
  }, []);

  const saveDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    window.localStorage.setItem('@timer:savedDecks', JSON.stringify(newDecks));
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja apagar este Deck?")) {
      saveDecks(decks.filter(d => d.id !== id));
    }
  };

  const handleEdit = (deck: Deck) => {
    setEditingId(deck.id);
    setEditTitle(deck.titulo);
    setEditAnnotation(deck.anotacao || "");
  };

  const handleSaveEdit = (id: number) => {
    saveDecks(decks.map(d => 
      d.id === id ? { ...d, titulo: editTitle, anotacao: editAnnotation } : d
    ));
    setEditingId(null);
  };

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Book size={40} className="text-amber-400 mb-4 opacity-50" />
        <h4 className="text-slate-200 font-medium mb-2">Caixa Vazia</h4>
        <p className="text-slate-400 text-sm">
          Você ainda não salvou nenhum deck de flashcards. Use a Sala de Leitura IA para criá-los!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {decks.map(deck => (
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
              <button 
                onClick={() => handleSaveEdit(deck.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <Check size={16} /> Salvar
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-200">{deck.titulo}</h4>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(deck)} className="text-slate-400 hover:text-amber-400 p-1" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(deck.id)} className="text-slate-400 hover:text-red-400 p-1" title="Apagar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {deck.anotacao && (
                <p className="text-slate-400 text-sm mb-3 italic">{deck.anotacao}</p>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-500 font-medium">
                  {deck.cards.length} cards
                </span>
                <button 
                  onClick={() => setStudyingDeck(deck)}
                  className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <Play size={16} /> Estudar
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {studyingDeck && (
        <FlashcardViewer 
          cards={studyingDeck.cards}
          title={studyingDeck.titulo}
          onClose={() => setStudyingDeck(null)}
        />
      )}
    </div>
  );
}
