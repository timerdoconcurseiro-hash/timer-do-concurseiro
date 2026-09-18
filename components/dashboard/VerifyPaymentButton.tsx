"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function VerifyPaymentButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Atualiza a sessão para garantir que as claims mais recentes do Supabase (plan=premium) sejam puxadas
    await supabase.auth.refreshSession();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Forçar leitura do DB para ver se plano mudou
      const { data } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single();
      
      if (data?.plan === 'premium') {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/vip"; // Hard redirect garantido
        }, 800);
        return;
      }
    }
    
    // Se ainda não for premium, só atualiza a tela
    router.refresh();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button
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
  );
}
