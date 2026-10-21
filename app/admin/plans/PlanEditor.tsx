"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import { QUOTA_LABELS, type Plan, type QuotaKind } from "@/lib/billing/plans";

const KINDS = Object.keys(QUOTA_LABELS) as QuotaKind[];
const toField = (n: number | null) => (n === null ? "" : String(n));

export function PlanEditor({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(toField(plan.price_monthly));
  const [pub, setPub] = useState(plan.public);
  const [quotas, setQuotas] = useState(Object.fromEntries(KINDS.map((k) => [k, toField(plan.quotas[k])])) as Record<QuotaKind, string>);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save() {
    try {
      await api("/api/admin/plans", "PUT", {
        id: plan.id, name, public: pub,
        price_monthly: price === "" ? null : Number(price),
        quotas: Object.fromEntries(KINDS.map((k) => [k, quotas[k] === "" ? null : Number(quotas[k])])),
      });
      setMsg({ ok: true, text: "Enregistré." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }
  return (
    <>
      <h2>{plan.id}</h2>
      <label htmlFor={`${plan.id}-name`}>Nom</label><input id={`${plan.id}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor={`${plan.id}-price`}>Prix mensuel ({plan.currency}, vide = sur devis)</label>
      <input id={`${plan.id}-price`} type="number" min={0} step={5} value={price} onChange={(e) => setPrice(e.target.value)} />
      {KINDS.map((k) => (
        <div key={k}><label htmlFor={`${plan.id}-${k}`}>{QUOTA_LABELS[k]}</label>
          <input id={`${plan.id}-${k}`} type="number" min={0} placeholder="Illimité" value={quotas[k]} onChange={(e) => setQuotas({ ...quotas, [k]: e.target.value })} /></div>
      ))}
      <label className="row" style={{ fontWeight: 400 }}><input type="checkbox" style={{ width: "auto" }} checked={pub} onChange={(e) => setPub(e.target.checked)} /> Proposée à la souscription</label>
      <button onClick={save} style={{ marginTop: 10 }}>Enregistrer</button>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </>
  );
}
