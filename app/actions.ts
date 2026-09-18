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

  // Agendamento Inteligente (Curva de Esquecimento 1d, 7d, 30d)
  // Só funciona para clientes premium (Opcional, mas vamos inserir para todos ou checar)
  // Vamos checar se o usuário é premium primeiro para gerar o valor do Ciclo
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', authData.user.id).single();
  
  if (profile?.plan === 'premium') {
    const today = new Date();
    
    // Calcula as 3 datas
    const d1 = new Date(today); d1.setDate(d1.getDate() + 1);
    const d7 = new Date(today); d7.setDate(d7.getDate() + 7);
    const d30 = new Date(today); d30.setDate(d30.getDate() + 30);

    const reviewsToInsert = [
      { user_id: authData.user.id, subject: data.subject, topic: data.topic, review_date: d1.toISOString().split('T')[0] },
      { user_id: authData.user.id, subject: data.subject, topic: data.topic, review_date: d7.toISOString().split('T')[0] },
      { user_id: authData.user.id, subject: data.subject, topic: data.topic, review_date: d30.toISOString().split('T')[0] },
    ];

    // Insere ignorando caso ele já tenha estudado isso hoje para evitar duplicatas pro mesmo dia
    for (const rev of reviewsToInsert) {
      // Checa se já existe uma revisão pendente igual para o mesmo dia
      const { data: existing } = await supabase
        .from('spaced_reviews')
        .select('id')
        .eq('user_id', rev.user_id)
        .eq('subject', rev.subject)
        .eq('review_date', rev.review_date)
        .eq('status', 'pending')
        .single();
        
      if (!existing) {
        await supabase.from('spaced_reviews').insert(rev);
      }
    }
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

export async function getEditalGoal() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data } = await supabase
    .from("exam_goals")
    .select("*")
    .eq("user_id", authData.user.id)
    .single();

  return data;
}

export async function saveEditalGoal(data: { examDate: string; targetHours: number }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("exam_goals")
    .upsert(
      {
        user_id: authData.user.id,
        exam_date: data.examDate,
        target_hours: data.targetHours,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Erro ao salvar meta de edital:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Retorna as horas totais estudadas pelo usuário (para o edital)
export async function getTotalStudiedHours() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return 0;

  const { data, error } = await supabase
    .from("study_sessions")
    .select("net_seconds")
    .eq("user_id", authData.user.id);

  if (error || !data) return 0;

  const totalSeconds = data.reduce((acc, curr) => acc + (curr.net_seconds || 0), 0);
  return totalSeconds / 3600;
}

export async function getTodayReviews() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("spaced_reviews")
    .select("*")
    .eq("user_id", authData.user.id)
    .eq("status", "pending")
    .lte("review_date", today)
    .order("review_date", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function markReviewCompleted(reviewId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false };

  const { error } = await supabase
    .from("spaced_reviews")
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", authData.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
