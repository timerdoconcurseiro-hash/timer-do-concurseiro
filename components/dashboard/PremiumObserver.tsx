"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPremium } from "@/lib/plans";

const POLL_MS = 3000;

/**
 * Observa o perfil do usuário free e redireciona para a Área VIP assim que o
 * webhook do Asaas liberar o plano. Polling (em vez de Realtime) para não exigir
 * configuração extra no Supabase. Pausa quando a aba está oculta.
 */
export function PremiumObserver({ userId, currentPlan }: { userId: string; currentPlan: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId || currentPlan === "premium" || currentPlan === "admin") return;

    const supabase = createClient();
    let cancelled = false;
    let inFlight = false;

    const check = async () => {
      if (cancelled || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) return; // falha de rede transitória — tenta no próximo ciclo
        if (!cancelled && isPremium(data)) {
          cancelled = true;
          router.replace("/vip");
        }
      } catch {
        // offline / erro de rede — ignora e tenta novamente
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [userId, currentPlan, router]);

  return null;
}
