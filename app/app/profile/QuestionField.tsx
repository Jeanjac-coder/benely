"use client";
import { optionsOf, type DQuestion } from "@/lib/diagnostic";
import type { AnswerValue, Answers } from "@/lib/questionnaire";

/** Une question du diagnostic, rendue selon son type (cartes, puces, segments, échelle…). */
export function QuestionField({ q, answers, onChange, invalid }: { q: DQuestion; answers: Answers; onChange: (v: AnswerValue | undefined) => void; invalid: boolean }) {
  const v = answers[q.id];
  const options = optionsOf(q, answers);
  const hintId = q.hint ? `${q.id}-hint` : undefined;
  const legend = (
    <legend className="dq-label" id={`${q.id}-label`}>
      {q.label}{q.required && <span className="dq-req" aria-hidden="true"> *</span>}
      {q.hint && <span className="dq-hint" id={hintId}>{q.hint}</span>}
    </legend>
  );
  const common = { "aria-invalid": invalid || undefined, "aria-describedby": hintId };

  if (q.type === "text" || q.type === "textarea" || q.type === "number") {
    const props = { id: q.id, ...common, placeholder: q.placeholder, required: q.required, value: v === undefined ? "" : String(v) };
    return (
      <fieldset className="dq-q" data-invalid={invalid || undefined}>
        {legend}
        {q.type === "textarea"
          ? <textarea {...props} rows={3} aria-labelledby={`${q.id}-label`} onChange={(e) => onChange(e.target.value)} />
          : q.type === "number"
            ? <input {...props} type="number" inputMode="numeric" min={0} aria-labelledby={`${q.id}-label`} onChange={(e) => onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : undefined)} />
            : <input {...props} aria-labelledby={`${q.id}-label`} onChange={(e) => onChange(e.target.value)} />}
      </fieldset>
    );
  }

  if (q.type === "select") {
    return (
      <fieldset className="dq-q" data-invalid={invalid || undefined}>
        {legend}
        <select id={q.id} {...common} aria-labelledby={`${q.id}-label`} value={typeof v === "string" ? v : ""} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Choisir…</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </fieldset>
    );
  }

  if (q.type === "scale") {
    const [lo, hi] = q.scale ?? ["Faible", "Élevé"];
    return (
      <fieldset className="dq-q" data-invalid={invalid || undefined} {...common}>
        {legend}
        <div className="dq-scale" role="radiogroup" aria-labelledby={`${q.id}-label`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="dq-scale-dot" data-on={v === n || undefined}>
              <input type="radio" name={q.id} value={n} checked={v === n} onChange={() => onChange(n)} />
              <span>{n}</span>
            </label>
          ))}
        </div>
        <div className="dq-scale-ends" aria-hidden="true"><span>{lo}</span><span>{hi}</span></div>
      </fieldset>
    );
  }

  const multi = q.type === "multi";
  const selected = multi ? (Array.isArray(v) ? v : []) : [];
  const toggle = (value: string) => {
    if (!multi) return onChange(value);
    if (q.exclusive && value === q.exclusive) return onChange(selected.includes(value) ? [] : [value]);
    const base = selected.filter((x) => x !== q.exclusive);
    onChange(base.includes(value) ? base.filter((x) => x !== value) : [...base, value]);
  };
  const cls = q.type === "cards" ? "dq-cards" : q.type === "segment" ? "dq-segment" : q.type === "radio" ? "dq-radios" : "dq-chips";
  return (
    <fieldset className="dq-q" data-invalid={invalid || undefined} {...common}>
      {legend}
      {multi && <span className="dq-hint">Plusieurs choix possibles</span>}
      <div className={cls} role={multi ? "group" : "radiogroup"} aria-labelledby={`${q.id}-label`}>
        {options.map((o) => {
          const on = multi ? selected.includes(o.value) : v === o.value;
          return (
            <label key={o.value} className="dq-opt" data-on={on || undefined}>
              <input type={multi ? "checkbox" : "radio"} name={q.id} value={o.value} checked={on} onChange={() => toggle(o.value)} />
              {o.emoji && <span className="dq-emoji" aria-hidden="true">{o.emoji}</span>}
              <span className="dq-opt-text">
                <span>{o.label}</span>
                {o.hint && <small>{o.hint}</small>}
              </span>
              {(multi || q.type === "radio") && <span className="dq-check" aria-hidden="true" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
