"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

export const STATUS_LABELS: Record<string, string> = { nouvelle: "Nouvelle", confirmee: "Confirmée", realisee: "Réalisée", annulee: "Annulée" };

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [err, setErr] = useState("");
  async function change(next: string) {
    setValue(next); setErr("");
    try { await api("/api/admin/consultations", "PATCH", { id, status: next }); router.refresh(); }
    catch (e) { setErr((e as Error).message); setValue(status); }
  }
  return (
    <>
      <select aria-label="Statut" value={value} onChange={(e) => change(e.target.value)}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {err && <span className="err small">{err}</span>}
    </>
  );
}
