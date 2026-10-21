import { label, NATURE_LABEL } from "./labels";

type V = unknown;
const isObj = (v: V): v is Record<string, V> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Affichage générique et lisible d'un livrable (objets, listes, affirmations qualifiées). */
export function ValueView({ value, name }: { value: V; name?: string }) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (typeof value === "number") return <span>{name === "budgetShare" || name === "share" ? `${(value * 100).toFixed(0)} %` : value.toLocaleString("fr-FR")}</span>;
  if (typeof value === "string") return name === "nature" ? <span className={`badge badge-${value}`}>{NATURE_LABEL[value] ?? value}</span> : <span className="pre">{value}</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="muted">—</span>;
    if (value.every((x) => typeof x === "string")) return <ul>{value.map((x, i) => <li key={i}>{x as string}</li>)}</ul>;
    return <div className="stack">{value.map((x, i) => <div key={i} className="item"><ValueView value={x} /></div>)}</div>;
  }
  if (isObj(value)) {
    if ("statement" in value && "nature" in value) {
      return (
        <p className="claim">
          <span className={`badge badge-${value.nature}`}>{NATURE_LABEL[value.nature as string]}</span> {value.statement as string}
          {value.source ? <span className="muted small"> — {value.source as string}{value.sourceDate ? ` (${value.sourceDate as string})` : ""}</span> : null}
        </p>
      );
    }
    return (
      <dl className="fields">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}><dt>{label(k)}</dt><dd><ValueView value={v} name={k} /></dd></div>
        ))}
      </dl>
    );
  }
  return <span>{String(value)}</span>;
}
