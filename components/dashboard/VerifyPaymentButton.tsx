"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function VerifyPaymentButton() {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Força a re-autenticação para atualizar a sessão e ler os dados frescos do banco
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="mt-6 mx-auto flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors underline"
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      Já comprei... acessar!
    </button>
  );
}
