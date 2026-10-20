"use client";
import { useState } from "react";

const parse = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

/** Saisie d'une liste séparée par des virgules; le texte brut est conservé pendant la frappe. */
export function ListInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [raw, setRaw] = useState(value.join(", "));
  return <input id={id} value={raw} placeholder={placeholder} onChange={(e) => { setRaw(e.target.value); onChange(parse(e.target.value)); }} />;
}
