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
    // Calcula as 3 datas (fuso de Brasília)
    const reviewsToInsert = [1, 7, 30].map((offset) => ({
      user_id: authData.user.id,
      subject: data.subject,
      topic: data.topic,
      review_date: todayKey(offset),
    }));

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

export async function getHeatmapData() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const { data, error } = await supabase
    .from("study_sessions")
    .select("finished_at, net_seconds, subject")
    .eq("user_id", authData.user.id)
    .order("finished_at", { ascending: true })
    .limit(5000);

  if (error || !data) return [];
  return data;
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

export async function getLastStudySession() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data } = await supabase
    .from("study_sessions")
    .select("subject, topic")
    .eq("user_id", authData.user.id)
    .order("finished_at", { ascending: false })
    .limit(1)
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

// Data local (YYYY-MM-DD) no fuso de Brasília, para evitar "pular" o dia após 21h (UTC)
function todayKey(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export async function getTodayReviews() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const today = todayKey();

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

export async function postponeReview(reviewId: string, days: number = 1) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const safeDays = Math.min(Math.max(Math.round(days), 1), 30);

  const { error } = await supabase
    .from("spaced_reviews")
    .update({ review_date: todayKey(safeDays), updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", authData.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ==========================================
// HELPERS DE MATÉRIA (normalização p/ cruzar sessões do Timer com o Edital)
// ==========================================

function normalizeName(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// O Timer salva "Disciplina (Complemento)". Extraímos só a disciplina.
function baseSubject(value: string) {
  const idx = (value || "").indexOf(" (");
  return (idx > 0 ? value.slice(0, idx) : value || "").trim();
}

function sessionMatchesSubject(sessionSubject: string, editalSubject: string) {
  const s = normalizeName(sessionSubject);
  const e = normalizeName(editalSubject);
  if (!e) return false;
  return normalizeName(baseSubject(sessionSubject)) === e || s.startsWith(e);
}

function daysBetweenLocal(from: Date) {
  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const a = new Date(from.toLocaleDateString("en-CA", tz) + "T00:00:00Z").getTime();
  const b = new Date(new Date().toLocaleDateString("en-CA", tz) + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

// ==========================================
// RADAR DE NEGLIGÊNCIA (dados reais do Supabase)
// ==========================================

export type RadarItem = {
  subject: string;
  daysAgo: number | null; // null = nunca estudada
  totalHours: number;
  status: "green" | "yellow" | "red" | "never";
};

export async function getRadarData(): Promise<RadarItem[]> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const [{ data: sessions }, { data: editalSubjects }] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("subject, finished_at, net_seconds")
      .eq("user_id", authData.user.id),
    supabase
      .from("edital_subjects")
      .select("name")
      .eq("user_id", authData.user.id),
  ]);

  const list = sessions || [];

  // Se houver edital cadastrado, o radar monitora as matérias do edital.
  // Caso contrário, monitora as matérias que aparecem no histórico do Timer.
  let subjectNames: string[];
  if (editalSubjects && editalSubjects.length > 0) {
    subjectNames = editalSubjects.map((s) => s.name);
  } else {
    const set = new Map<string, string>();
    list.forEach((s) => {
      const base = baseSubject(s.subject);
      if (!base || normalizeName(base) === "sem materia definida") return;
      if (!set.has(normalizeName(base))) set.set(normalizeName(base), base);
    });
    subjectNames = Array.from(set.values());
  }

  const items: RadarItem[] = subjectNames.map((name) => {
    const matches = list.filter((s) => sessionMatchesSubject(s.subject, name));
    const totalHours = Number(
      (matches.reduce((acc, s) => acc + (s.net_seconds || 0), 0) / 3600).toFixed(1)
    );

    if (matches.length === 0) {
      return { subject: name, daysAgo: null, totalHours: 0, status: "never" };
    }

    const last = matches.reduce((latest, s) => {
      const d = new Date(s.finished_at);
      return d > latest ? d : latest;
    }, new Date(0));

    const daysAgo = daysBetweenLocal(last);
    const status: RadarItem["status"] = daysAgo <= 3 ? "green" : daysAgo <= 7 ? "yellow" : "red";
    return { subject: name, daysAgo, totalHours, status };
  });

  const weight = { never: 4, red: 3, yellow: 2, green: 1 };
  items.sort((a, b) => {
    if (weight[a.status] !== weight[b.status]) return weight[b.status] - weight[a.status];
    return (b.daysAgo ?? 0) - (a.daysAgo ?? 0);
  });

  return items;
}

// ==========================================
// EDITAL VERTICALIZADO (IA + GAMIFICAÇÃO)
// ==========================================

type GeneratedEdital = {
  subjects: { name: string; target_hours: number; topics: string[] }[];
};

function sanitizeGeneratedEdital(raw: unknown): GeneratedEdital | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as any).subjects)) return null;

  const subjects = ((raw as any).subjects as any[])
    .filter((s) => s && typeof s.name === "string" && s.name.trim())
    .slice(0, 60)
    .map((s) => ({
      name: String(s.name).trim().slice(0, 150),
      target_hours: Math.min(Math.max(Math.round(Number(s.target_hours) || 0), 0), 2000),
      topics: (Array.isArray(s.topics) ? s.topics : [])
        .map((t: unknown) => (typeof t === "string" ? t : (t as any)?.name))
        .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
        .slice(0, 200)
        .map((t: string) => t.trim().slice(0, 300)),
    }));

  return subjects.length > 0 ? { subjects } : null;
}

export async function saveGeneratedEdital(editalData: unknown) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const edital = sanitizeGeneratedEdital(editalData);
  if (!edital) {
    return { success: false, error: "A IA não retornou matérias válidas. Tente novamente com um texto mais limpo." };
  }

  try {
    for (const subject of edital.subjects) {
      const { data: subjData, error: subjErr } = await supabase
        .from("edital_subjects")
        .insert({
          user_id: authData.user.id,
          name: subject.name,
          target_hours: subject.target_hours,
        })
        .select("id")
        .single();

      if (subjErr) throw subjErr;

      if (subject.topics.length > 0) {
        const { error: topErr } = await supabase.from("edital_topics").insert(
          subject.topics.map((topicName) => ({
            subject_id: subjData.id,
            name: topicName,
            completed: false,
          }))
        );
        if (topErr) throw topErr;
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erro ao salvar edital:", err);
    return { success: false, error: err.message };
  }
}

export type EditalTopic = { id: string; name: string; completed: boolean };
export type EditalSubject = {
  id: string;
  name: string;
  target_hours: number;
  studied_hours: number;
  edital_topics: EditalTopic[];
};

export async function getEditalVerticalizado(): Promise<{ success: boolean; data: EditalSubject[]; error?: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, data: [] };

  const [{ data, error }, { data: sessions }] = await Promise.all([
    supabase
      .from("edital_subjects")
      .select(`
        id, name, target_hours, created_at,
        edital_topics (id, name, completed, created_at)
      `)
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("study_sessions")
      .select("subject, net_seconds")
      .eq("user_id", authData.user.id),
  ]);

  if (error) return { success: false, data: [], error: error.message };

  const result: EditalSubject[] = (data || []).map((s: any) => {
    // Horas estudadas calculadas a partir das sessões reais do Timer
    const seconds = (sessions || [])
      .filter((sess) => sessionMatchesSubject(sess.subject, s.name))
      .reduce((acc, sess) => acc + (sess.net_seconds || 0), 0);

    const topics = [...(s.edital_topics || [])].sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      id: s.id,
      name: s.name,
      target_hours: s.target_hours || 0,
      studied_hours: Number((seconds / 3600).toFixed(1)),
      edital_topics: topics.map((t: any) => ({ id: t.id, name: t.name, completed: !!t.completed })),
    };
  });

  return { success: true, data: result };
}

export async function toggleTopicCompleted(topicId: string, completed: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("edital_topics")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", topicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addEditalSubject(name: string, targetHours: number) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const cleanName = (name || "").trim().slice(0, 150);
  if (!cleanName) return { success: false, error: "Informe o nome da matéria." };

  const { error } = await supabase.from("edital_subjects").insert({
    user_id: authData.user.id,
    name: cleanName,
    target_hours: Math.min(Math.max(Math.round(Number(targetHours) || 0), 0), 2000),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateEditalSubject(subjectId: string, data: { name?: string; targetHours?: number }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const patch: Record<string, unknown> = {};
  if (typeof data.name === "string") {
    const cleanName = data.name.trim().slice(0, 150);
    if (!cleanName) return { success: false, error: "O nome não pode ficar vazio." };
    patch.name = cleanName;
  }
  if (typeof data.targetHours === "number") {
    patch.target_hours = Math.min(Math.max(Math.round(data.targetHours), 0), 2000);
  }

  const { error } = await supabase
    .from("edital_subjects")
    .update(patch)
    .eq("id", subjectId)
    .eq("user_id", authData.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteEditalSubject(subjectId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("edital_subjects")
    .delete()
    .eq("id", subjectId)
    .eq("user_id", authData.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addEditalTopic(subjectId: string, name: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const cleanName = (name || "").trim().slice(0, 300);
  if (!cleanName) return { success: false, error: "Informe o nome do tópico." };

  // Garante que a matéria pertence ao usuário
  const { data: subject } = await supabase
    .from("edital_subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("user_id", authData.user.id)
    .single();
  if (!subject) return { success: false, error: "Matéria não encontrada." };

  const { error } = await supabase
    .from("edital_topics")
    .insert({ subject_id: subjectId, name: cleanName, completed: false });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteEditalTopic(topicId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  // RLS de edital_topics garante que só tópicos do próprio usuário são afetados
  const { error } = await supabase.from("edital_topics").delete().eq("id", topicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteEditalVerticalizado() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("edital_subjects")
    .delete()
    .eq("user_id", authData.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
