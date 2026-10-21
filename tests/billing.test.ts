import { test } from "node:test";
import assert from "node:assert/strict";
import { canUse, effectiveStatus, quotaError, quotaWindowStart, type Subscription } from "../lib/billing/plans.ts";
import { cinetpay, mapCinetPayStatus } from "../lib/billing/cinetpay.ts";
import { newTransactionId } from "../lib/billing/provider.ts";

const sub = (over: Partial<Subscription>): Subscription => ({
  plan_id: "business", status: "active", current_period_start: "2026-10-01T00:00:00Z", current_period_end: "2026-11-01T00:00:00Z", cancel_at_period_end: false, ...over,
});
const at = (s: string) => new Date(s);

test("statut effectif: essai, retard, délai de grâce, résiliation", () => {
  assert.equal(effectiveStatus(sub({}), at("2026-10-20T00:00:00Z")), "active");
  assert.equal(effectiveStatus(sub({}), at("2026-11-02T00:00:00Z")), "past_due");
  assert.equal(effectiveStatus(sub({}), at("2026-11-05T00:00:00Z")), "expired");
  assert.equal(effectiveStatus(sub({ status: "trialing" }), at("2026-11-02T00:00:00Z")), "expired");
  assert.equal(effectiveStatus(sub({ cancel_at_period_end: true }), at("2026-10-31T00:00:00Z")), "active");
  assert.equal(effectiveStatus(sub({ cancel_at_period_end: true }), at("2026-11-02T00:00:00Z")), "canceled");
  assert.equal(canUse(sub({}), at("2026-11-03T00:00:00Z")), true);
  assert.equal(canUse(sub({}), at("2026-11-10T00:00:00Z")), false);
});

test("fenêtre des quotas: mois glissant borné au début de période", () => {
  assert.equal(quotaWindowStart(sub({}), at("2026-10-20T00:00:00Z")).toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(quotaWindowStart(sub({ current_period_end: "2026-12-01T00:00:00Z" }), at("2026-11-20T00:00:00Z")).toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(quotaError("exports", 10, 9), null);
  assert.match(quotaError("exports", 10, 10)!, /Quota atteint: exports \(10\/10\)/);
  assert.equal(quotaError("exports", null, 1000), null);
});

test("CinetPay: initialisation et vérification", async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fake = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({ url, body });
    const data = url.endsWith("/check")
      ? { code: "00", message: "SUCCES", data: { status: "ACCEPTED", payment_method: "OMCIV2" } }
      : { code: "201", message: "CREATED", data: { payment_url: "https://checkout.cinetpay.com/payment/abc" } };
    return new Response(JSON.stringify(data));
  }) as unknown as typeof fetch;
  const cp = cinetpay("key", "123", fake);
  const tx = newTransactionId();
  assert.match(tx, /^[A-Z0-9]+$/);
  const r = await cp.init({ transactionId: tx, amount: 19900, currency: "XOF", description: "Benely #Business", returnUrl: "https://x/r", notifyUrl: "https://x/n", customer: { name: "Awa Koné", email: "a@b.ci" } });
  assert.equal(r.paymentUrl, "https://checkout.cinetpay.com/payment/abc");
  assert.equal(calls[0].url, "https://api-checkout.cinetpay.com/v2/payment");
  assert.equal(calls[0].body.apikey, "key");
  assert.equal(calls[0].body.description, "Benely  Business");
  const c = await cp.check(tx);
  assert.equal(c.status, "accepted");
  assert.equal(c.method, "OMCIV2");
  await assert.rejects(cp.init({ transactionId: tx, amount: 9901, currency: "XOF", description: "x", returnUrl: "", notifyUrl: "", customer: { name: "a", email: "a@b.ci" } }), /multiple de 5/);
});

test("statuts CinetPay inconnus: jamais d'activation", () => {
  assert.equal(mapCinetPayStatus("ACCEPTED"), "accepted");
  assert.equal(mapCinetPayStatus("REFUSED"), "refused");
  assert.equal(mapCinetPayStatus("WAITING_FOR_CUSTOMER"), "pending");
  assert.equal(mapCinetPayStatus(undefined), "pending");
});

test("coût IA estimé par modèle", async () => {
  const { estimateCostUsd } = await import("../lib/ai/pricing.ts");
  assert.equal(estimateCostUsd("claude-opus-5-5", 1_000_000, 100_000), 6);
  assert.equal(estimateCostUsd("claude-sonnet-5-5", 1_000_000, 0), 2);
  assert.equal(estimateCostUsd("modele-inconnu", 1_000_000, 0), 4, "tarif prudent par défaut");
});
