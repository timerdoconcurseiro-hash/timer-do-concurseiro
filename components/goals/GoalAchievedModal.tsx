"use client";

interface GoalAchievedModalProps {
  open: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#38BDF8", "#F97316", "#EF4444", "#F8FAFC", "#0EA5E9"];

export function GoalAchievedModal({ open, onClose }: GoalAchievedModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-accent bg-app-surface p-6 text-center shadow-[0_0_60px_rgba(56,189,248,0.35)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-2 rounded-sm animate-[fall_1.8s_ease-in_forwards]"
              style={{
                left: `${(i * 37) % 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 6) * 0.12}s`,
              }}
            />
          ))}
        </div>

        <p className="text-4xl">🎉🏆</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
          Meta Alcançada!
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Incrível! Você acaba de bater a sua meta diária de estudos. Todo o
          esforço de hoje é a sua aprovação de amanhã. Continue firme!
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-2xl bg-gradient-to-r from-action-start to-action-end px-6 py-2.5 font-medium text-app-bg shadow-lg transition hover:opacity-90"
        >
          Continuar Focado
        </button>
      </div>

      <style jsx global>{`
        @keyframes fall {
          from {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(260px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
