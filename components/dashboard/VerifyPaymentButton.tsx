"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { isPremium } from "@/lib/plans";

export function VerifyPaymentButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleVerify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();

      // Atualiza a sessão para garantir que as claims mais recentes sejam puxadas
      await supabase.auth.refreshSession();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Faça login para validar sua assinatura.");
        return;
      }

      // Forçar leitura do DB para ver se plano mudou
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (isPremium(data)) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/vip");
        }, 800);
        return;
      }

      setMessage("Pagamento ainda não confirmado. Pix costuma liberar em segundos.");
      router.refresh();
    } catch {
      setMessage("Não foi possível verificar agora. Tente novamente em instantes.");
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || success}
        className={`mt-4 mx-auto flex items-center justify-center gap-2 text-xs md:text-sm px-4 py-2 rounded-full border transition-all 
          ${success 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600'
          }`}
      >
        {success ? (
          <><CheckCircle2 size={16} /> Acesso Liberado!</>
        ) : (
          <><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Validar Assinatura</>
        )}
      </button>
      {message && !success && (
        <p className="mt-2 text-xs text-slate-500 text-center max-w-xs" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
