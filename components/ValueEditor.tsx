"use client";
import { ENUMS, label, OPTION_LABELS } from "./labels";

type V = unknown;
const isObj = (v: V): v is Record<string, V> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Valeur vide de même forme, pour ajouter un élément à une liste. */
function blank(v: V): V {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (Array.isArray(v)) return [];
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ENUMS[k] ? ENUMS[k][0] : blank(x)]));
  return v;
}

/** Éditeur générique: le livrable est modifiable champ par champ, sans exposer de JSON. */
export function ValueEditor({ value, onChange, name, path = "" }: { value: V; onChange: (v: V) => void; name?: string; path?: string }) {
  const id = `f-${path}`;
  if (typeof value === "string") {
    if (name && ENUMS[name]) {
      return (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {ENUMS[name].map((o) => <option key={o} value={o}>{OPTION_LABELS[o] ?? o}</option>)}
        </select>
      );
    }
    return value.length > 60 || value.includes("\n")
      ? <textarea id={id} rows={Math.min(8, Math.ceil(value.length / 80) + 1)} value={value} onChange={(e) => onChange(e.target.value)} />
      : <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  if (typeof value === "number") return <input id={id} type="number" step="any" value={value} onChange={(e) => onChange(e.target.valueAsNumber || 0)} />;
  if (value === null) return <input id={id} value="" placeholder="Aucune" onChange={(e) => onChange(e.target.value || null)} />;
  if (Array.isArray(value)) {
    const template = value[value.length - 1] ?? "";
    return (
      <div className="stack">
        {value.map((x, i) => (
          <div key={i} className="item row-top">
            <div className="grow"><ValueEditor value={x} path={`${path}.${i}`} onChange={(nx) => onChange(value.map((y, j) => (j === i ? nx : y)))} /></div>
            <button type="button" className="ghost" aria-label="Supprimer" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="ghost" onClick={() => onChange([...value, blank(template)])}>+ Ajouter</button>
      </div>
    );
  }
  if (isObj(value)) {
    return (
      <div className="fields">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <label htmlFor={`f-${path}.${k}`}>{label(k)}</label>
            <ValueEditor value={v} name={k} path={`${path}.${k}`} onChange={(nv) => onChange({ ...value, [k]: nv })} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}
