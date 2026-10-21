export const CURRENCIES = { XOF: "FCFA (XOF)", XAF: "FCFA (XAF)", NGN: "Naira", GHS: "Cedi", KES: "Shilling kényan", MAD: "Dirham", USD: "Dollar US", EUR: "Euro" } as const;
export type Currency = keyof typeof CURRENCIES;

const NO_DECIMALS = new Set(["XOF", "XAF"]);

export function formatMoney(amount: number, currency: string = "XOF"): string {
  const digits = NO_DECIMALS.has(currency) ? 0 : 2;
  const n = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  return NO_DECIMALS.has(currency) ? `${n} FCFA` : `${n} ${currency}`;
}
