"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

const STATUSES = ["trialing", "active", "past_due", "canceled", "expired"];

/** Ajustement manuel (offre sur devis, geste commercial, support). Journalisé dans l'audit. */
export function SubscriptionEditor({ orgId, planId, status, periodEnd, plans }: { orgId: string; planId: string; status: string; periodEnd: string; plans: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ planId, status, periodEnd, reason: "" });
  const [error, setError] = useState("");
  if (!open) return <button className="ghost" onClick={() => setOpen(true)}>Ajuster</button>;
  async function save() {
    try {
      await api("/api/admin/subscriptions", "PUT", { orgId, ...v });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="stack" style={{ minWidth: 200 }}>
      <select aria-label="Offre" value={v.planId} onChange={(e) => setV({ ...v, planId: e.target.value })}>{plans.map((p) => <option key={p}>{p}</option>)}</select>
      <select aria-label="Statut" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      <input aria-label="Échéance" type="date" value={v.periodEnd} onChange={(e) => setV({ ...v, periodEnd: e.target.value })} />
      <input aria-label="Motif" placeholder="Motif (obligatoire)" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} />
      <div className="row"><button onClick={save} disabled={!v.reason.trim()}>Enregistrer</button><button className="ghost" onClick={() => setOpen(false)}>Annuler</button></div>
      {error && <p className="err small">{error}</p>}
    </div>
  );
}
