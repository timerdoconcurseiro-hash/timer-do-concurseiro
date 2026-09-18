"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStudySession(data: {
  subject: string;
  topic?: string;
  mode: string;
  netSeconds: number;
  grossSeconds: number;
  startedAt: string;
  finishedAt: string;
}) {
  const supabase = await createClient();
  
  // 1. Validação de Segurança dos Dados (Evita números negativos ou strings imensas/XSS)
  if (
    typeof data.subject !== "string" || data.subject.length > 100 ||
    typeof data.mode !== "string" ||
    typeof data.netSeconds !== "number" || data.netSeconds < 0 ||
    typeof data.grossSeconds !== "number" || data.grossSeconds < 0
  ) {
    return { success: false, error: "Dados de entrada inválidos." };
  }

  // 2. Verificar usuário logado
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Usuário não autenticado." };
  }

  // 3. Inserir na tabela
  const { error } = await supabase.from("study_sessions").insert({
    user_id: authData.user.id,
    subject: data.subject,
    topic: data.topic,
    mode: data.mode,
    net_seconds: data.netSeconds,
    gross_seconds: data.grossSeconds,
    started_at: data.startedAt,
    finished_at: data.finishedAt,
  });

  if (error) {
    console.error("Erro ao salvar sessão no Supabase:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Retorna horas agrupadas por matéria para o PieChart
export async function getSubjectAnalytics() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  
  if (!authData.user) {
    return { success: false, data: [] };
  }

  // Pegamos as sessões para processar
  const { data, error } = await supabase
    .from("study_sessions")
    .select("subject, net_seconds")
    .eq("user_id", authData.user.id);

  if (error || !data) {
    return { success: false, data: [] };
  }

  // Agrupar por matéria
  const grouped: Record<string, number> = {};
  data.forEach((session) => {
    if (!grouped[session.subject]) {
      grouped[session.subject] = 0;
    }
    grouped[session.subject] += session.net_seconds;
  });

  // Converter para o formato do Recharts { name, value } e transformar segundos em horas
  const chartData = Object.entries(grouped)
    .map(([name, seconds]) => ({
      name,
      value: Number((seconds / 3600).toFixed(2)), // Horas com 2 casas
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value); // Ordenar do maior pro menor

  return { success: true, data: chartData };
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();
    
  return data;
}
