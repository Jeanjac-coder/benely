import { ProviderError, type CheckResult, type InitParams, type PaymentProvider, type ProviderStatus } from "./provider.ts";

const API = "https://api-checkout.cinetpay.com/v2";

type Fetch = typeof fetch;

/** Traduit le statut CinetPay; tout statut inconnu reste « en attente » (jamais d'activation par défaut). */
export function mapCinetPayStatus(status: unknown): ProviderStatus {
  switch (String(status ?? "").toUpperCase()) {
    case "ACCEPTED": return "accepted";
    case "REFUSED": return "refused";
    case "CANCELED": case "CANCELLED": return "cancelled";
    default: return "pending";
  }
}

export function cinetpay(apikey: string, siteId: string, fetchImpl: Fetch = fetch): PaymentProvider {
  async function post(path: string, body: Record<string, unknown>) {
    const res = await fetchImpl(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apikey, site_id: siteId, ...body }) });
    const data = await res.json().catch(() => null) as { code?: string; message?: string; description?: string; data?: Record<string, unknown> } | null;
    if (!data) throw new ProviderError(`Réponse illisible du prestataire (HTTP ${res.status}).`);
    return data;
  }

  return {
    name: "cinetpay",
    async init(p: InitParams) {
      if (p.amount % 5 !== 0) throw new ProviderError("Le montant doit être un multiple de 5.");
      const [surname, ...rest] = p.customer.name.trim().split(/\s+/);
      const r = await post("/payment", {
        transaction_id: p.transactionId,
        amount: p.amount,
        currency: p.currency,
        description: p.description.replace(/[#/$_&]/g, " "),
        notify_url: p.notifyUrl,
        return_url: p.returnUrl,
        channels: "ALL",
        lang: "fr",
        customer_name: rest.join(" ") || surname || "Client",
        customer_surname: surname || "Benely",
        customer_email: p.customer.email,
      });
      const url = r.data?.payment_url;
      if (r.code !== "201" || typeof url !== "string") throw new ProviderError(`Initialisation refusée par CinetPay: ${r.description || r.message || r.code}`);
      return { paymentUrl: url };
    },
    async check(transactionId: string): Promise<CheckResult> {
      const r = await post("/payment/check", { transaction_id: transactionId });
      const status = mapCinetPayStatus(r.data?.status);
      return {
        status,
        method: typeof r.data?.payment_method === "string" ? r.data.payment_method : null,
        reason: status === "refused" || status === "cancelled" ? String(r.message ?? r.data?.status ?? "") : null,
        raw: r,
      };
    },
  };
}
