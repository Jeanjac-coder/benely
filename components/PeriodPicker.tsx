"use client";
import { useState } from "react";
import type { Period } from "@/lib/ai/schemas";
import { presetPeriod, validatePeriod, type PeriodPreset } from "@/lib/calendar";

const NAMES: Record<PeriodPreset, string> = { "7j": "7 jours", "30j": "30 jours", "3m": "3 mois", libre: "Période libre" };

export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [preset, setPreset] = useState<PeriodPreset>("30j");
  const apply = (p: PeriodPreset, start: string) => {
    setPreset(p);
    if (p !== "libre") { try { onChange(presetPeriod(p, start)); } catch { /* date incomplète */ } }
  };
  const invalid = validatePeriod(value);
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend><b>Période du calendrier</b></legend>
      <div className="row">
        {(Object.keys(NAMES) as PeriodPreset[]).map((p) => (
          <label key={p} className="row" style={{ fontWeight: 400, margin: 0 }}>
            <input type="radio" name="preset" style={{ width: "auto" }} checked={preset === p} onChange={() => apply(p, value.start)} /> {NAMES[p]}
          </label>
        ))}
      </div>
      <div className="grid">
        <div><label htmlFor="start">Début</label><input id="start" type="date" value={value.start}
          onChange={(e) => (preset === "libre" ? onChange({ ...value, start: e.target.value }) : apply(preset, e.target.value))} /></div>
        <div><label htmlFor="end">Fin</label><input id="end" type="date" value={value.end} disabled={preset !== "libre"}
          onChange={(e) => onChange({ ...value, end: e.target.value })} /></div>
      </div>
      {invalid && <p className="err small">{invalid}</p>}
    </fieldset>
  );
}
