"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import { ValueEditor } from "@/components/ValueEditor";
import { ValueView } from "@/components/ValueView";
import { STEP_LABELS, STEPS, type Deliverables, type Step } from "@/lib/ai/schemas";
import type { StrategyVersion } from "@/lib/repo";

const SOURCES: Record<string, string> = { generation: "Génération", edit: "Modification", regeneration: "Régénération", budget: "Budget" };

export function StrategyEditor({ strategyId, title, version, versions }: {
  strategyId: string; title: string; version: StrategyVersion;
  versions: { version: number; source: string; note: string | null; created_at: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Step>("diagnostic");
  const [draft, setDraft] = useState<Deliverables | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const d = draft ?? version.deliverables;
  const issues = version.issues.filter((i) => i.section === tab || (tab === "diagnostic" && i.section === "meta"));

  async function run(label: string, fn: () => Promise<unknown>, success: string) {
    setBusy(label); setMsg(null);
    try {
      await fn();
      setDraft(null);
      setMsg({ ok: true, text: success });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h1>{title}</h1>
      <p className="muted small">Version {version.version} · {SOURCES[version.source]} · {new Date(version.created_at).toLocaleString("fr-FR")}</p>
      <div className="row" role="tablist">
        {STEPS.map((s) => (
          <button key={s} role="tab" aria-selected={tab === s} className={tab === s ? "" : "ghost"} onClick={() => setTab(s)} disabled={draft !== null && tab !== s}>{STEP_LABELS[s]}</button>
        ))}
      </div>

      {issues.length > 0 && (
        <div className="card">
          <h2>Points de contrôle</h2>
          <ul>{issues.map((i, k) => <li key={k} className={`issue-${i.severity}`}>{i.message}</li>)}</ul>
        </div>
      )}

      <section className="card" role="tabpanel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>{STEP_LABELS[tab]}</h2>
          {draft ? (
            <div className="row">
              <button className="ghost" onClick={() => setDraft(null)} disabled={!!busy}>Annuler</button>
              <button disabled={!!busy} onClick={() => run("save", () => api(`/api/strategies/${strategyId}`, "PUT", { deliverables: draft, note: `Modification: ${STEP_LABELS[tab]}` }), "Modifications enregistrées dans une nouvelle version.")}>
                {busy === "save" ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          ) : (
            <div className="row">
              <button className="ghost" onClick={() => setDraft(structuredClone(version.deliverables))} disabled={!!busy}>Modifier</button>
              <button className="ghost" disabled={!!busy} onClick={() => confirm(`Régénérer « ${STEP_LABELS[tab]} » ? Une nouvelle version sera créée.`) &&
                run("regen", () => api(`/api/strategies/${strategyId}/regenerate`, "POST", { step: tab }), "Livrable régénéré.")}>
                {busy === "regen" ? "Régénération…" : "Régénérer"}
              </button>
            </div>
          )}
        </div>
        {draft
          ? <ValueEditor value={d[tab]} path={tab} onChange={(v) => setDraft({ ...d, [tab]: v } as Deliverables)} />
          : <ValueView value={d[tab]} />}
        {tab === "market" && d.meta.sources.length > 0 && (
          <>
            <h3>Sources consultées</h3>
            <ul className="small">{d.meta.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>{s.date ? ` (${s.date})` : ""}</li>)}</ul>
          </>
        )}
      </section>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}

      <section className="card">
        <h2>Historique des versions</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Version</th><th>Origine</th><th>Note</th><th>Date</th><th /></tr></thead>
          <tbody>{versions.map((v) => (
            <tr key={v.version}>
              <td>{v.version}</td><td>{SOURCES[v.source]}</td><td>{v.note ?? "—"}</td><td>{new Date(v.created_at).toLocaleString("fr-FR")}</td>
              <td>{v.version !== version.version && (
                <button className="ghost" disabled={!!busy} onClick={() => run("restore", () => api(`/api/strategies/${strategyId}/restore`, "POST", { version: v.version }), `Version ${v.version} restaurée.`)}>Restaurer</button>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
    </>
  );
}
