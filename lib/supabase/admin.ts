import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("[supabase/admin] Este módulo não pode ser importado no navegador.");
}

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase com Service Role (ignora RLS).
 * USO EXCLUSIVO NO SERVIDOR (webhooks, rotas administrativas).
 * Falha imediatamente se as variáveis de ambiente não estiverem configuradas,
 * em vez de criar um cliente "silenciosamente quebrado".
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "[supabase/admin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
