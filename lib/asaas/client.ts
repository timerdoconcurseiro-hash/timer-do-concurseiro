import type {
  AsaasCustomer,
  AsaasCustomerListResponse,
  AsaasErrorItem,
  AsaasPayment,
  AsaasPixQrCode,
} from "./types";

/**
 * Cliente HTTP tipado para a API v3 do Asaas (somente servidor).
 * - ASAAS_API_URL: https://api-sandbox.asaas.com/v3 (testes) ou https://api.asaas.com/v3 (produção)
 * - ASAAS_API_KEY: chave da conta ($aact_...)
 */

const DEFAULT_TIMEOUT_MS = 10_000;

export class AsaasError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: AsaasErrorItem[] = [],
  ) {
    super(message);
    this.name = "AsaasError";
  }

  /** Erros 5xx / timeout / rede valem nova tentativa. 4xx não. */
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY && process.env.ASAAS_API_URL);
}

async function asaasFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_API_URL?.replace(/\/+$/, "");
  if (!apiKey || !baseUrl) {
    throw new AsaasError("Integração Asaas não configurada (ASAAS_API_KEY/ASAAS_API_URL).", 0);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TimerDoConcurseiro/1.0",
        access_token: apiKey,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new AsaasError(`Falha de comunicação com o Asaas: ${reason}`, 0);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // corpo vazio ou não-JSON
  }

  if (!res.ok) {
    const errors = ((json as { errors?: AsaasErrorItem[] })?.errors || []).filter(Boolean);
    const message = errors[0]?.description || `Asaas respondeu HTTP ${res.status}`;
    throw new AsaasError(message, res.status, errors);
  }

  return json as T;
}

export function getCustomer(customerId: string) {
  return asaasFetch<AsaasCustomer>(`/customers/${encodeURIComponent(customerId)}`);
}

export function findCustomersByEmail(email: string) {
  return asaasFetch<AsaasCustomerListResponse>(`/customers?email=${encodeURIComponent(email)}`);
}

export function createCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  externalReference?: string;
}) {
  return asaasFetch<AsaasCustomer>(`/customers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCustomer(
  customerId: string,
  input: Partial<{ name: string; email: string; cpfCnpj: string; externalReference: string }>,
) {
  return asaasFetch<AsaasCustomer>(`/customers/${encodeURIComponent(customerId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function createPixPayment(input: {
  customer: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
}) {
  return asaasFetch<AsaasPayment>(`/payments`, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      billingType: "PIX",
    }),
  });
}

export function getPixQrCode(paymentId: string) {
  return asaasFetch<AsaasPixQrCode>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
}

export function getPayment(paymentId: string) {
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export { asaasFetch };
