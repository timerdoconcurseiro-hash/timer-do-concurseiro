"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PremiumObserver({ userId, currentPlan }: { userId: string, currentPlan: string }) {
  const router = useRouter();

  useEffect(() => {
    if (currentPlan === "premium" || !userId) return;

    const supabase = createClient();
    let isMounted = true;

    // Polling a cada 3 segundos para liberar a tela imediatamente após o webhook do Asaas alterar o DB.
    // Usamos polling em vez de Realtime apenas porque Realtime precisa ser ativado na tabela pelo painel do Supabase.
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();

      if (isMounted && data?.plan === "premium") {
        // Redirecionamento Automático: Efeito Mágica após pagamento Asaas
        window.location.href = '/vip'; 
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId, currentPlan, router]);

  return null;
}
