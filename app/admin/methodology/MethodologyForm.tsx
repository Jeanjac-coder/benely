"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

type Version = { version: number; title: string; active: boolean; created_at: string };

/** Publication d'une nouvelle version (Markdown) et réactivation d'une version antérieure. */
export function MethodologyForm({ versions, current }: { versions: Version[]; current: { title: string; content: string } | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(current?.title ?? "");
  const [content, setContent] = useState(current?.content ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setMsg("");
    try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="card">
        <h2>Publier une nouvelle version</h2>
        <p className="muted small">Collez le document au format Markdown (titres « ## », listes, tableaux). La nouvelle version devient active pour les générations suivantes; les stratégies existantes gardent la version avec laquelle elles ont été produites.</p>
        <label htmlFor="m-title">Titre</label>
        <input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="m-content">Contenu (Markdown)</label>
        <textarea id="m-content" rows={18} value={content} onChange={(e) => setContent(e.target.value)} style={{ fontFamily: "ui-monospace, monospace", fontSize: ".82rem" }} />
        <div className="row" style={{ marginTop: 12 }}>
          <button disabled={busy} onClick={() => run(() => api("/api/admin/methodology", "POST", { title, content }), "Nouvelle version publiée et activée.")}>
            Publier et activer
          </button>
          {msg && <span className="small" role="status">{msg}</span>}
        </div>
      </div>
      <div className="card">
        <h2>Historique</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Version</th><th>Titre</th><th>Date</th><th></th></tr></thead>
          <tbody>{versions.map((v) => (
            <tr key={v.version}>
              <td>v{v.version}</td><td>{v.title}</td><td>{new Date(v.created_at).toLocaleDateString("fr-FR")}</td>
              <td>{v.active ? <span className="badge badge-fait">Active</span>
                : <button className="ghost" disabled={busy} onClick={() => run(() => api("/api/admin/methodology", "PUT", { version: v.version }), `Version ${v.version} réactivée.`)}>Réactiver</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
