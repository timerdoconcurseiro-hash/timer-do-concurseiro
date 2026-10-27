import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

export type GeminiPromptInput = string | Part | Array<string | Part>;

export interface GenerateContentResilientOptions {
  systemInstruction?: string;
  temperature?: number;
  maxRetriesPerModel?: number;
  responseMimeType?: string;
}

/**
 * Cascata de modelos Gemini em ordem de prioridade:
 * 1. Modelo primário (GEMINI_MODEL ou "gemini-3.5-flash")
 * 2. Fallbacks estáveis ("gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash")
 */
export function getGeminiModelCascade(): string[] {
  const configuredPrimary = process.env.GEMINI_MODEL?.trim();
  const rawList = [
    configuredPrimary || "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
  ];
  return Array.from(new Set(rawList.filter(Boolean)));
}

/**
 * Identifica erros transitórios de sobrecarga ou rate-limit (503, 429, high demand, ResourceExhausted)
 * que merecem retry com backoff exponencial no mesmo modelo antes de descer para o fallback.
 */
export function isTransientGeminiError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : NaN;

  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
    return true;
  }

  return /503|429|service unavailable|high demand|resourceexhausted|resource_exhausted|overloaded|rate limit|quota|unavailable|etimedout|econnreset|fetch failed/i.test(
    message,
  );
}

/**
 * Identifica erros fatais de autenticação/chave inválida onde não adianta tentar outro modelo.
 */
function isFatalAuthError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : NaN;

  if (status === 401 || status === 403) return true;
  return /api_key_invalid|invalid api key|permission_denied/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executa `generateContent` no Gemini com:
 * - Retry com Backoff Exponencial (1s, 2s, 4s) para erros 503 / 429 / high demand / ResourceExhausted;
 * - Fallback automático em cascata entre modelos (`gemini-3.5-flash` -> `gemini-2.5-flash` -> `gemini-2.5-pro` -> `gemini-2.0-flash`).
 */
export async function generateContentResilient(
  prompt: GeminiPromptInput,
  options?: GenerateContentResilientOptions,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave da API do Gemini (GEMINI_API_KEY) não configurada no servidor.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = getGeminiModelCascade();
  const maxRetriesPerModel = options?.maxRetriesPerModel ?? 3;

  let lastError: unknown = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(options?.systemInstruction
            ? { systemInstruction: options.systemInstruction }
            : {}),
          generationConfig: {
            ...(typeof options?.temperature === "number"
              ? { temperature: options.temperature }
              : {}),
            ...(options?.responseMimeType
              ? { responseMimeType: options.responseMimeType }
              : {}),
          },
        });

        const requestInput = Array.isArray(prompt) ? prompt : [prompt];
        const result = await model.generateContent(requestInput);
        const text = result.response.text();

        if (!text || !text.trim()) {
          throw new Error(`Modelo ${modelName} retornou resposta vazia.`);
        }

        return text;
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);

        if (isFatalAuthError(err)) {
          console.error(`[Gemini Resilient] Erro de autenticação fatal em ${modelName}:`, errMsg);
          throw err instanceof Error ? err : new Error(errMsg);
        }

        const isTransient = isTransientGeminiError(err);

        if (isTransient && attempt < maxRetriesPerModel) {
          // Backoff exponencial: 1s (2^0 * 1000), 2s (2^1 * 1000), 4s (2^2 * 1000)
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          console.warn(
            `[Gemini Resilient] ${modelName} falhou por sobrecarga/rate-limit (tentativa ${attempt}/${maxRetriesPerModel}). Aguardando ${delayMs}ms antes do retry... Detalhe: ${errMsg}`,
          );
          await sleep(delayMs);
          continue;
        }

        console.warn(
          `[Gemini Resilient] Alternando de ${modelName} (após ${attempt} tentativa(s)) para o próximo modelo de fallback. Motivo: ${errMsg}`,
        );
        break;
      }
    }
  }

  const finalDetail =
    lastError instanceof Error
      ? lastError.message
      : "Todos os modelos Gemini estão temporariamente indisponíveis.";
  throw new Error(
    `Não foi possível processar o edital na IA após múltiplas tentativas e fallbacks (${models.join(" → ")}). Detalhe: ${finalDetail}`,
  );
}
