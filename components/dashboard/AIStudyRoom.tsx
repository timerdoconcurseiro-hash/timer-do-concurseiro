"use client";

import React, { useState, useEffect, useRef } from "react";
import { Brain, FileText, Send, Loader2, Sparkles, CheckCircle2, Copy, Trash2, AlertCircle, Eraser, Play } from "lucide-react";
import { getLastStudySession } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import { FlashcardViewer, type Flashcard } from "./FlashcardViewer";
import { addDeck } from "@/lib/storage/decks";

const MIN_CHARS = 50;
const MAX_CHARS = 30000;

type StudyResult = { summary: string[]; flashcards: Flashcard[] };

function isValidResult(data: any): data is StudyResult {
  return (
    data &&
    Array.isArray(data.summary) &&
    Array.isArray(data.flashcards) &&
    data.flashcards.every((c: any) => c && typeof c.question === "string" && typeof c.answer === "string")
  );
}

export function AIStudyRoom() {
  const searchParams = useSearchParams();
  const urlSubject = searchParams.get("subject");
  const urlTopic = searchParams.get("topic");
  const rootRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<StudyResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Preenche Matéria/Assunto a partir da Missão do dia (URL) ou da última sessão do Timer
  useEffect(() => {
    if (urlSubject) {
      setSubject(urlSubject);
      setTopic(urlTopic || "");
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    let cancelled = false;
    getLastStudySession().then((data) => {
      if (cancelled || !data) return;
      setSubject((prev) => prev || data.subject || "");
      setTopic((prev) => prev || data.topic || "");
    });
    return () => {
      cancelled = true;
    };
  }, [urlSubject, urlTopic]);

  const handleGenerate = async () => {
    if (text.trim().length < MIN_CHARS) {
      setError(`Cole pelo menos ${MIN_CHARS} caracteres para a IA analisar.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setIsSaved(false);

    const maxRetries = 2;
    const payload = {
      textContext: {
        texto: text.slice(0, MAX_CHARS),
        disciplina: subject.trim(),
        assunto_complemento: topic.trim(),
      },
    };

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let res: Response;
        try {
          res = await fetch("/api/ai/study", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          // Falha de rede: tenta novamente
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          throw new Error("Falha de conexão. Verifique sua internet e tente novamente.");
        }

        if (!res.ok) {
          if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Erro ${res.status} ao processar o material.`);
        }

        const json = await res.json();
        if (!isValidResult(json.data)) {
          throw new Error("A IA retornou um formato inesperado. Tente novamente.");
        }
        setResult(json.data);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Nossa IA está com alta demanda. Aguarde alguns instantes e tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveCard = (index: number) => {
    if (!result) return;
    setResult({ ...result, flashcards: result.flashcards.filter((_, i) => i !== index) });
    setIsSaved(false);
  };

  const handleCopySummary = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.summary.map((p) => `• ${p}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar para a área de transferência.");
    }
  };

  const handleSaveFlashcards = () => {
    if (!result || result.flashcards.length === 0) return;
    const titulo = [subject.trim(), topic.trim()].filter(Boolean).join(" - ") || "Novo Deck";
    addDeck({
      titulo,
      anotacao: result.summary.slice(0, 3).join(" "),
      cards: result.flashcards,
    });
    setIsSaved(true);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
    setIsSaved(false);
  };

  const charCount = text.length;

  return (
    <div ref={rootRef} className="flex flex-col gap-6 scroll-mt-6">
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/50">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <FileText size={18} className="text-amber-400" />
          Material de Estudo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Matéria (ex: Direito Administrativo)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none transition-colors"
          />
          <input
            type="text"
            placeholder="Assunto (ex: Atos Administrativos)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="Cole aqui o trecho da apostila, PDF ou lei seca que você está lendo agora..."
          className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-amber-500 outline-none transition-colors resize-y mb-1"
        />
        <div className="flex justify-between text-[11px] text-slate-500 mb-3">
          <span>{charCount < MIN_CHARS ? `Mínimo de ${MIN_CHARS} caracteres` : "Pronto para analisar"}</span>
          <span>
            {charCount.toLocaleString("pt-BR")}/{MAX_CHARS.toLocaleString("pt-BR")}
          </span>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isProcessing || charCount < MIN_CHARS}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
            {isProcessing ? "Lendo material e criando flashcards..." : "Analisar com Inteligência Artificial"}
          </button>
          {(text || result) && !isProcessing && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Limpar"
            >
              <Eraser size={18} />
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-6 rounded-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                <Sparkles size={18} /> Resumo Focado
              </h4>
              <button
                type="button"
                onClick={handleCopySummary}
                className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <ul className="space-y-2">
              {result.summary.map((point, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                <Brain size={18} /> Flashcards Gerados ({result.flashcards.length})
              </h4>
              {result.flashcards.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewIndex(0);
                    setPreviewOpen(true);
                  }}
                  className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play size={14} /> Abrir no Modo Foco
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {result.flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setPreviewIndex(i);
                    setPreviewOpen(true);
                  }}
                  className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 transition-all relative group cursor-pointer"
                >
                  <p className="text-sm font-semibold text-white pr-6 group-hover:text-emerald-300 transition-colors">
                    <span className="text-emerald-500 mr-2">Q{i + 1}.</span>
                    {card.question}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{card.answer}</p>
                  <span className="text-[11px] text-amber-400/80 font-medium mt-2 inline-block">
                    Clique para estudar em Modo Foco →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(i);
                    }}
                    className="absolute top-3 right-3 text-slate-600 hover:text-red-400 p-1"
                    title="Descartar este card"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveFlashcards}
              disabled={isSaved || result.flashcards.length === 0}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed ${
                isSaved
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-900 disabled:opacity-50"
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={18} /> Deck salvo na Caixa de Flashcards!
                </>
              ) : (
                <>
                  <Send size={18} /> Salvar na Caixa de Flashcards
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {previewOpen && result && (
        <FlashcardViewer
          cards={result.flashcards}
          title={[subject.trim(), topic.trim()].filter(Boolean).join(" - ") || "Modo Foco"}
          initialIndex={previewIndex}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
