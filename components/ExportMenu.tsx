"use client";
import { useState } from "react";

/** Téléchargement d'un export; affiche le message du serveur en cas de refus (quota, abonnement). */
export function ExportMenu({ sections = "all", label = "Exporter" }: { sections?: string; label?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function download(format: "pdf" | "docx" | "xlsx") {
    setBusy(format); setError("");
    try {
      const res = await fetch(`/api/exports?format=${format}&sections=${sections}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Export impossible.");
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `benely.${format}`;
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: name });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="row small">
      <span>{label}:</span>
      {(["pdf", "docx", "xlsx"] as const).map((f) => (
        <button key={f} className="ghost" disabled={!!busy} onClick={() => download(f)}>{busy === f ? "…" : f.toUpperCase()}</button>
      ))}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
