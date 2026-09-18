"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
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
          router.push("/vip");
          router.refresh();
        }, 1000);
        return;
      }
    }
    
    // Se ainda não for premium, só atualiza a tela
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading || success}
      className={`mt-6 mx-auto flex items-center justify-center gap-2 text-sm transition-colors underline ${success ? 'text-emerald-400 no-underline' : 'text-slate-400 hover:text-white'}`}
    >
      {loading && !success && <Loader2 className="animate-spin" size={16} />}
      {success && <CheckCircle2 size={16} />}
      {success ? "Pagamento Confirmado! Redirecionando..." : "Já comprei... acessar!"}
    </button>
  );
}
