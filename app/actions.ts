"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStudySession(data: {
  clientSessionId?: string;
  subject: string;
  topic?: string;
  mode: string;
  netSeconds: number;
  grossSeconds: number;
  startedAt: string;
  finishedAt: string;
  editalTopicId?: string | null;
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
    return { success: false, error: "Usuário não autenticado.", unauthenticated: true };
  }

  // 3. Inserir na tabela (com suporte às novas colunas se a migration já foi aplicada)
  const baseRow: Record<string, unknown> = {
    user_id: authData.user.id,
    subject: data.subject,
    topic: data.topic,
    mode: data.mode,
    net_seconds: data.netSeconds,
    gross_seconds: data.grossSeconds,
    started_at: data.startedAt,
    finished_at: data.finishedAt,
  };

  const extendedRow: Record<string, unknown> = { ...baseRow };
  if (data.clientSessionId) extendedRow.client_session_id = data.clientSessionId;
  if (data.editalTopicId) extendedRow.edital_topic_id = data.editalTopicId;

  const { error } = data.clientSessionId
    ? await supabase
        .from("study_sessions")
        .upsert(extendedRow, { onConflict: "client_session_id", ignoreDuplicates: true })
    : await supabase.from("study_sessions").insert(extendedRow);

  if (error) {
    // Fallback caso as colunas client_session_id / edital_topic_id ainda não existam no banco
    if (error.code === "42703" || error.code === "PGRST204" || error.code === "42P10") {
      const { error: fallbackErr } = await supabase.from("study_sessions").insert(baseRow);
      if (fallbackErr) {
        console.error("Erro ao salvar sessão no Supabase (fallback):", fallbackErr);
        return { success: false, error: fallbackErr.message };
      }
      return { success: true };
    }
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

  const { data, error } = await supabase
    .from("study_sessions")
    .select("subject, net_seconds")
    .eq("user_id", authData.user.id);

  if (error || !data) {
    return { success: false, data: [] };
  }

  const grouped: Record<string, number> = {};
  data.forEach((session) => {
    const subj = baseSubject(session.subject);
    if (!grouped[subj]) {
      grouped[subj] = 0;
    }
    grouped[subj] += session.net_seconds;
  });

  const chartData = Object.entries(grouped)
    .map(([name, seconds]) => ({
      name,
      value: Number((seconds / 3600).toFixed(2)),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

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

// ==========================================
// EDITAL VERTICALIZADO (IA + GAMIFICAÇÃO)
// ==========================================

type GeneratedEdital = {
  subjects: { name: string; target_hours: number; topics: string[] }[];
};

function sanitizeGeneratedEdital(raw: unknown): GeneratedEdital | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { subjects?: unknown }).subjects)) return null;

  const rawSubjects = (raw as { subjects: unknown[] }).subjects;
  const subjects = rawSubjects
    .filter((s): s is { name: string; target_hours?: unknown; topics?: unknown } =>
      Boolean(s && typeof s === "object" && typeof (s as { name?: unknown }).name === "string" && (s as { name: string }).name.trim())
    )
    .slice(0, 60)
    .map((s) => ({
      name: String(s.name).trim().slice(0, 150),
      target_hours: Math.min(Math.max(Math.round(Number(s.target_hours) || 0), 0), 2000),
      topics: (Array.isArray(s.topics) ? s.topics : [])
        .map((t: unknown) => (typeof t === "string" ? t : (t as { name?: unknown })?.name))
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao salvar edital.";
    console.error("Erro ao salvar edital:", err);
    return { success: false, error: message };
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

  const result: EditalSubject[] = (data || []).map((s) => {
    const seconds = (sessions || [])
      .filter((sess) => sessionMatchesSubject(sess.subject, s.name))
      .reduce((acc, sess) => acc + (sess.net_seconds || 0), 0);

    const topics = [...(s.edital_topics || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      id: s.id,
      name: s.name,
      target_hours: s.target_hours || 0,
      studied_hours: Number((seconds / 3600).toFixed(1)),
      edital_topics: topics.map((t) => ({ id: t.id, name: t.name, completed: !!t.completed })),
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
