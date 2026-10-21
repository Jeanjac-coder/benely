export type ProviderStatus = "accepted" | "refused" | "cancelled" | "pending";

export interface InitParams {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  customer: { name: string; email: string };
}

export interface CheckResult {
  status: ProviderStatus;
  method: string | null;
  reason: string | null;
  raw: unknown;
}

/** Interface commune: un autre prestataire (PayDunya, Flutterwave…) s'ajoute sans toucher au reste. */
export interface PaymentProvider {
  name: string;
  init(p: InitParams): Promise<{ paymentUrl: string }>;
  check(transactionId: string): Promise<CheckResult>;
}

export class ProviderError extends Error {}

/** Identifiant de transaction: alphanumérique (CinetPay refuse certains caractères spéciaux). */
export function newTransactionId(now = Date.now()): string {
  return `BEN${now.toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
