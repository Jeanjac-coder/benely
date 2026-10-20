import type { Period } from "./ai/schemas.ts";

export const PERIOD_PRESETS = { "7j": 7, "30j": 30, "3m": 91 } as const;
export type PeriodPreset = keyof typeof PERIOD_PRESETS | "libre";
export const MAX_PERIOD_DAYS = 92;

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function parseDay(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || iso(d) !== s ? null : d;
}

export function periodDays(p: Period): number {
  const s = parseDay(p.start), e = parseDay(p.end);
  if (!s || !e) return 0;
  return Math.round((e.getTime() - s.getTime()) / DAY) + 1;
}

/** Période à partir d'un préréglage; `start` est le premier jour inclus. */
export function presetPeriod(preset: keyof typeof PERIOD_PRESETS, start: string): Period {
  const s = parseDay(start);
  if (!s) throw new Error("Date de début invalide");
  return { start, end: iso(new Date(s.getTime() + (PERIOD_PRESETS[preset] - 1) * DAY)) };
}

export function validatePeriod(p: Period): string | null {
  const days = periodDays(p);
  if (days <= 0) return "La date de fin doit suivre la date de début.";
  if (days > MAX_PERIOD_DAYS) return `La période ne peut pas dépasser ${MAX_PERIOD_DAYS} jours.`;
  return null;
}

export function inPeriod(day: string, p: Period): boolean {
  return parseDay(day) !== null && day >= p.start && day <= p.end;
}

/** Nombre de publications visé: environ une par jour sur 7 jours, puis 3 à 4 par semaine. */
export function targetEntryCount(p: Period): number {
  const days = periodDays(p);
  return days <= 7 ? Math.max(days - 1, 3) : Math.round((days / 7) * 3.5);
}

export function today(): string {
  return iso(new Date());
}
