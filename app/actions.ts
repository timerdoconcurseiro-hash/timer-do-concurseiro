"use server";

import { createClient } from "@/lib/supabase/server";

export type TopicStatus = "none" | "red" | "yellow" | "green";

const VALID_STATUSES = new Set<TopicStatus>(["none", "red", "yellow", "green"]);

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
  try {
    const supabase = await createClient();

    if (
      typeof data.subject !== "string" ||
      data.subject.length > 100 ||
      typeof data.mode !== "string" ||
      typeof data.netSeconds !== "number" ||
      data.netSeconds < 0 ||
      typeof data.grossSeconds !== "number" ||
      data.grossSeconds < 0
    ) {
      return { success: false, error: "Dados de entrada inválidos." };
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return { success: false, error: "Usuário não autenticado.", unauthenticated: true };
    }

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
      // Fallback caso as colunas da migration 05 ainda não tenham sido criadas no Supabase
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao salvar sessão.";
    console.error("[saveStudySession]", err);
    return { success: false, error: message };
  }
}

export async function getSubjectAnalytics() {
  try {
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
  } catch (err) {
    console.error("[getSubjectAnalytics]", err);
    return { success: false, data: [] };
  }
}

export async function getHeatmapData() {
  try {
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
  } catch (err) {
    console.error("[getHeatmapData]", err);
    return [];
  }
}

export async function getUserProfile() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return data;
  } catch (err) {
    console.error("[getUserProfile]", err);
    return null;
  }
}

export async function saveExamNameAction(examName: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const clean = (examName || "").trim().slice(0, 120) || "Meu Concurso Alvo";
    const { error } = await supabase
      .from("profiles")
      .update({ exam_name: clean })
      .eq("id", authData.user.id);

    if (error) {
      // Se a coluna exam_name ainda não existir, ignora silenciosamente (client salva em localStorage)
      if (error.code === "42703" || error.code === "PGRST204") {
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar nome." };
  }
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

function baseSubject(value: string) {
  const idx = (value || "").indexOf(" (");
  return (idx > 0 ? value.slice(0, idx) : value || "").trim();
}

function extractSessionComplement(value: string) {
  const match = (value || "").match(/^.+?\s*\((.+)\)$/);
  return match ? match[1].trim() : "";
}

function sessionMatchesSubject(sessionSubject: string, editalSubject: string) {
  const s = normalizeName(sessionSubject);
  const e = normalizeName(editalSubject);
  if (!e) return false;
  return normalizeName(baseSubject(sessionSubject)) === e || s.startsWith(e);
}

// ==========================================
// EDITAL VERTICALIZADO (IA + SEMÁFORO + TEMPO LÍQUIDO)
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
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const edital = sanitizeGeneratedEdital(editalData);
    if (!edital) {
      return { success: false, error: "A IA não retornou matérias válidas. Tente novamente com um texto mais limpo." };
    }

    // 1. Tenta via RPC transacional (1 única chamada ao Postgres — Migration 05)
    const { error: rpcError } = await supabase.rpc("save_generated_edital_rpc", {
      payload: edital,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Fallback em lote caso a função RPC ainda não tenha sido criada no Supabase
    for (let idx = 0; idx < edital.subjects.length; idx++) {
      const subject = edital.subjects[idx];
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

export type EditalTopic = {
  id: string;
  name: string;
  completed: boolean;
  status: TopicStatus;
  studied_seconds: number;
};

export type EditalSubject = {
  id: string;
  name: string;
  target_hours: number;
  studied_hours: number;
  edital_topics: EditalTopic[];
};

export async function getEditalVerticalizado(): Promise<{
  success: boolean;
  data: EditalSubject[];
  examName?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, data: [] };

    const [{ data, error }, { data: sessions }] = await Promise.all([
      supabase
        .from("edital_subjects")
        .select(`
          id, name, target_hours, created_at,
          edital_topics (*)
        `)
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", authData.user.id),
    ]);

    if (error) return { success: false, data: [], error: error.message };

    const allSessions = (sessions || []) as Array<{
      subject: string;
      topic?: string | null;
      net_seconds?: number | null;
      edital_topic_id?: string | null;
    }>;

    // Agrupa tempo estudado por edital_topic_id (quando vinculado)
    const secondsByTopicId = new Map<string, number>();
    for (const sess of allSessions) {
      if (sess.edital_topic_id && (sess.net_seconds || 0) > 0) {
        secondsByTopicId.set(
          sess.edital_topic_id,
          (secondsByTopicId.get(sess.edital_topic_id) || 0) + (sess.net_seconds || 0)
        );
      }
    }

    const result: EditalSubject[] = (data || []).map((s) => {
      const subjectSessions = allSessions.filter((sess) => sessionMatchesSubject(sess.subject, s.name));
      const subjectSeconds = subjectSessions.reduce((acc, sess) => acc + (sess.net_seconds || 0), 0);

      const rawTopics = Array.isArray(s.edital_topics) ? s.edital_topics : [];
      const sortedTopics = [...rawTopics].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const posA = typeof a.position === "number" ? a.position : 0;
        const posB = typeof b.position === "number" ? b.position : 0;
        if (posA !== posB) return posA - posB;
        return new Date(String(a.created_at || 0)).getTime() - new Date(String(b.created_at || 0)).getTime();
      });

      const mappedTopics: EditalTopic[] = sortedTopics.map((t: Record<string, unknown>) => {
        const tId = String(t.id);
        const tName = String(t.name || "");
        const completed = Boolean(t.completed);
        const rawStatus = String(t.status || "");
        const status: TopicStatus = VALID_STATUSES.has(rawStatus as TopicStatus)
          ? (rawStatus as TopicStatus)
          : completed
          ? "green"
          : "none";

        // Tempo do tópico: maior valor entre coluna studied_seconds (trigger) e soma das sessões vinculadas ou com mesmo nome de tópico
        const colSeconds = typeof t.studied_seconds === "number" ? t.studied_seconds : 0;
        const idSeconds = secondsByTopicId.get(tId) || 0;
        const normTopic = normalizeName(tName);
        const nameSeconds = normTopic
          ? subjectSessions
              .filter(
                (sess) =>
                  !sess.edital_topic_id &&
                  (normalizeName(sess.topic || "") === normTopic ||
                    normalizeName(extractSessionComplement(sess.subject)) === normTopic)
              )
              .reduce((acc, sess) => acc + (sess.net_seconds || 0), 0)
          : 0;

        const studied_seconds = Math.max(colSeconds, idSeconds + nameSeconds);

        return {
          id: tId,
          name: tName,
          completed: status === "green" || completed,
          status,
          studied_seconds,
        };
      });

      return {
        id: s.id,
        name: s.name,
        target_hours: s.target_hours || 0,
        studied_hours: Number((subjectSeconds / 3600).toFixed(1)),
        edital_topics: mappedTopics,
      };
    });

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar edital.";
    console.error("[getEditalVerticalizado]", err);
    return { success: false, data: [], error: message };
  }
}

export async function setTopicStatus(topicId: string, status: TopicStatus) {
  try {
    if (!VALID_STATUSES.has(status)) {
      return { success: false, error: "Status de semáforo inválido." };
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const completed = status === "green";
    const completed_at = completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("edital_topics")
      .update({
        status,
        completed,
        completed_at,
      })
      .eq("id", topicId);

    if (error) {
      // Fallback caso a coluna `status` ainda não exista (antes de rodar a Migration 05)
      if (error.code === "42703" || error.code === "PGRST204") {
        const { error: fallbackErr } = await supabase
          .from("edital_topics")
          .update({ completed, completed_at })
          .eq("id", topicId);
        if (fallbackErr) return { success: false, error: fallbackErr.message };
        return { success: true, migrationPending: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao salvar cor do semáforo.",
    };
  }
}

export async function toggleTopicCompleted(topicId: string, completed: boolean) {
  return setTopicStatus(topicId, completed ? "green" : "none");
}

export async function addEditalSubject(name: string, targetHours: number) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const cleanName = (name || "").trim().slice(0, 150);
    if (!cleanName) return { success: false, error: "Informe o nome da matéria." };

    const cleanHours = Math.min(Math.max(Math.round(Number(targetHours) || 0), 0), 2000);

    const { data, error } = await supabase
      .from("edital_subjects")
      .insert({
        user_id: authData.user.id,
        name: cleanName,
        target_hours: cleanHours,
      })
      .select("id, name, target_hours")
      .single();

    if (error) return { success: false, error: error.message };
    return {
      success: true,
      subject: {
        id: data.id,
        name: data.name,
        target_hours: data.target_hours || 0,
        studied_hours: 0,
        edital_topics: [],
      } as EditalSubject,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao criar matéria." };
  }
}

export async function updateEditalSubject(
  subjectId: string,
  data: { name?: string; targetHours?: number }
) {
  try {
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
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar matéria." };
  }
}

export async function deleteEditalSubject(subjectId: string) {
  try {
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
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir matéria." };
  }
}

export async function addEditalTopic(subjectId: string, name: string) {
  try {
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

    const { data, error } = await supabase
      .from("edital_topics")
      .insert({ subject_id: subjectId, name: cleanName, completed: false })
      .select("id, name")
      .single();

    if (error) return { success: false, error: error.message };
    return {
      success: true,
      topic: {
        id: data.id,
        name: data.name,
        completed: false,
        status: "none",
        studied_seconds: 0,
      } as EditalTopic,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao adicionar tópico." };
  }
}

export async function deleteEditalTopic(topicId: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const { error } = await supabase.from("edital_topics").delete().eq("id", topicId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir tópico." };
  }
}

export async function deleteEditalVerticalizado() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "Não autenticado" };

    const { error } = await supabase
      .from("edital_subjects")
      .delete()
      .eq("user_id", authData.user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao resetar edital." };
  }
}
