"use client";

import React, { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import type { EditalSubject, EditalTopic, TopicStatus } from "@/app/actions";
import { TopicRow } from "./TopicRow";

interface SubjectRowProps {
  subject: EditalSubject;
  filteredTopics: EditalTopic[];
  isOpen: boolean;
  onToggleOpen: (subjectId: string) => void;
  onSaveEditSubject: (subjectId: string, name: string, targetHours: number) => Promise<void>;
  onDeleteSubject: (subjectId: string, name: string) => void;
  onStatusChange: (subjectId: string, topicId: string, nextStatus: TopicStatus) => void;
  onAddTopic: (subjectId: string, name: string) => Promise<boolean>;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
}

export const SubjectRow = memo(function SubjectRow({
  subject,
  filteredTopics,
  isOpen,
  onToggleOpen,
  onSaveEditSubject,
  onDeleteSubject,
  onStatusChange,
  onAddTopic,
  onDeleteTopic,
}: SubjectRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const [editHours, setEditHours] = useState(String(subject.target_hours || 0));

  const [newTopicName, setNewTopicName] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const sTotal = subject.edital_topics.length;
  const sGreen = subject.edital_topics.filter((t) => t.status === "green").length;
  const sYellow = subject.edital_topics.filter((t) => t.status === "yellow").length;
  const sRed = subject.edital_topics.filter((t) => t.status === "red").length;
  const sPercent = sTotal === 0 ? 0 : Math.round((sGreen / sTotal) * 100);

  const handleStartEdit = () => {
    setEditName(subject.name);
    setEditHours(String(subject.target_hours || 0));
    setIsEditing(true);
  };

  const handleConfirmEdit = async () => {
    const clean = editName.trim();
    if (!clean) return;
    const hours = Math.max(0, Number(editHours) || 0);
    setIsEditing(false);
    await onSaveEditSubject(subject.id, clean, hours);
  };

  const handleSubmitTopic = async () => {
    const clean = newTopicName.trim();
    if (!clean || savingTopic) return;
    setSavingTopic(true);
    try {
      const ok = await onAddTopic(subject.id, clean);
      if (ok) setNewTopicName("");
    } finally {
      setSavingTopic(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden transition-all hover:border-slate-700">
      {isEditing ? (
        <div className="p-4 flex flex-wrap items-center gap-2 bg-slate-900/80">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmEdit()}
            className="flex-1 min-w-[160px] bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white"
          />
          <input
            type="number"
            min="0"
            value={editHours}
            onChange={(e) => setEditHours(e.target.value)}
            className="w-24 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white"
            placeholder="Horas"
          />
          <button
            type="button"
            onClick={handleConfirmEdit}
            className="p-2 bg-emerald-500 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-1"
          >
            <Check size={14} /> Salvar
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors gap-2">
          <button
            type="button"
            onClick={() => onToggleOpen(subject.id)}
            className="flex-1 flex flex-col text-left min-w-0"
          >
            <span className="font-semibold text-slate-200 truncate">{subject.name}</span>
            <span className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>
                Estudado: <strong className="text-slate-300">{subject.studied_hours || 0}h</strong> /{" "}
                {subject.target_hours}h
              </span>
              <span>•</span>
              <span>
                Dominados: <strong className="text-emerald-400">{sGreen}</strong>/{sTotal} ({sPercent}%)
              </span>
              {(sYellow > 0 || sRed > 0) && (
                <span className="inline-flex items-center gap-2">
                  {sYellow > 0 && <span className="text-amber-300">🟡 {sYellow}</span>}
                  {sRed > 0 && <span className="text-red-300">🔴 {sRed}</span>}
                </span>
              )}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 bg-slate-800 rounded-full h-1.5 hidden md:flex overflow-hidden">
              {sTotal > 0 && (
                <>
                  <div
                    className="bg-emerald-500 h-1.5"
                    style={{ width: `${(sGreen / sTotal) * 100}%` }}
                  />
                  <div
                    className="bg-amber-400 h-1.5"
                    style={{ width: `${(sYellow / sTotal) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 h-1.5"
                    style={{ width: `${(sRed / sTotal) * 100}%` }}
                  />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-slate-500 hover:text-amber-400 p-1"
              title="Editar matéria"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteSubject(subject.id, subject.name)}
              className="text-slate-500 hover:text-red-400 p-1"
              title="Excluir matéria"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onToggleOpen(subject.id)}
              className="text-slate-400 p-1"
              aria-label="Expandir tópicos"
            >
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-slate-800/50 bg-slate-900/20 p-2 space-y-1">
          {filteredTopics.map((topic) => (
            <TopicRow
              key={topic.id}
              subjectId={subject.id}
              subjectName={subject.name}
              topic={topic}
              onStatusChange={onStatusChange}
              onDelete={onDeleteTopic}
            />
          ))}

          {filteredTopics.length === 0 && (
            <div className="p-3 text-xs text-slate-500 text-center">Nenhum tópico encontrado.</div>
          )}

          {/* Adicionar novo tópico */}
          <div className="flex gap-2 pt-2 px-1">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitTopic()}
              placeholder="Novo tópico nesta matéria..."
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
            />
            <button
              type="button"
              onClick={handleSubmitTopic}
              disabled={savingTopic || !newTopicName.trim()}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40"
            >
              {savingTopic ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
