"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoForm({ hasLogo }: { hasLogo: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/orgs/logo", { method: "POST", body: new FormData(e.currentTarget) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? { ok: true, text: "Logo enregistré." } : { ok: false, text: data.error ?? "Échec de l'envoi." });
    if (res.ok) router.refresh();
  }
  async function remove() {
    await fetch("/api/orgs/logo", { method: "DELETE" });
    router.refresh();
  }
  return (
    <form onSubmit={upload}>
      <label htmlFor="logo">Fichier PNG ou JPEG (1 Mo maximum)</label>
      <input id="logo" name="logo" type="file" accept="image/png,image/jpeg" required />
      <div className="row" style={{ marginTop: 12 }}>
        <button>Enregistrer</button>
        {hasLogo && <button type="button" className="ghost" onClick={remove}>Retirer le logo</button>}
      </div>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
