"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

export function ProfileForm({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api("/api/me", "PUT", { firstName: first, lastName: last });
      setMsg({ ok: true, text: "Profil enregistré." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="grid">
        <div><label htmlFor="p-first">Prénom</label><input id="p-first" autoComplete="given-name" required maxLength={80} value={first} onChange={(e) => setFirst(e.target.value)} /></div>
        <div><label htmlFor="p-last">Nom</label><input id="p-last" autoComplete="family-name" required maxLength={80} value={last} onChange={(e) => setLast(e.target.value)} /></div>
      </div>
      <label htmlFor="p-email">E-mail</label>
      <input id="p-email" value={email} disabled />
      <button disabled={busy} style={{ marginTop: 14 }}>{busy ? <><span className="spinner" /> Enregistrement…</> : "Enregistrer"}</button>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
