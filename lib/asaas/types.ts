/** Tipos mínimos da API v3 do Asaas usados pelo projeto. */

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED" | string;

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | string;

export interface AsaasPayment {
  id: string;
  customer: string; // "cus_..."
  value: number;
  netValue?: number;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  externalReference?: string | null;
  description?: string | null;
  dueDate?: string;
  invoiceUrl?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  externalReference?: string | null;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate?: string;
}

export interface AsaasCustomerListResponse {
  data: AsaasCustomer[];
}

export interface AsaasWebhookBody {
  id?: string; // id do evento (ex.: "evt_...")
  event?: string;
  dateCreated?: string;
  payment?: AsaasPayment;
}

export interface AsaasErrorItem {
  code: string;
  description: string;
}
