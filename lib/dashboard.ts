import { parseDay } from "./calendar.ts";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(parseDay(s)!.getTime() + n * DAY));

export interface WeekBar { start: string; label: string; count: number; current: boolean }

/** Publications par semaine (lundi → dimanche) sur la période, avec la semaine en cours repérée. */
export function weeklyCounts(dates: string[], period: { start: string; end: string }, today: string): WeekBar[] {
  const start = parseDay(period.start), end = parseDay(period.end);
  if (!start || !end || end < start) return [];
  const monday = (d: Date) => new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
  const bars: WeekBar[] = [];
  for (let w = monday(start); w <= end && bars.length < 14; w = new Date(w.getTime() + 7 * DAY)) {
    const s = iso(w), e = addDays(s, 6);
    bars.push({
      start: s,
      label: `${w.getUTCDate()}/${w.getUTCMonth() + 1}`,
      count: dates.filter((d) => d >= s && d <= e).length,
      current: today >= s && today <= e,
    });
  }
  return bars;
}

/** Avancement d'une campagne dans le temps, entre 0 et 1. */
export function campaignProgress(c: { startDate: string; durationDays: number }, today: string): number {
  const s = parseDay(c.startDate), t = parseDay(today);
  if (!s || !t || c.durationDays <= 0) return 0;
  return Math.min(1, Math.max(0, (t.getTime() - s.getTime()) / DAY / c.durationDays));
}

export type ObjectiveStatus = "en_cours" | "proche" | "echu";

/** Statut d'un objectif selon son échéance: échu, proche (30 jours) ou en cours. */
export function objectiveStatus(deadline: string, today: string): ObjectiveStatus {
  if (deadline < today) return "echu";
  return deadline <= addDays(today, 30) ? "proche" : "en_cours";
}

export interface CalendarDay { day: string; inMonth: boolean; count: number; today: boolean }

/** Grille du mois de `today` (semaines du lundi au dimanche) avec le nombre de publications par jour. */
export function monthGrid(today: string, dates: string[]): { title: string; days: CalendarDay[] } {
  const t = parseDay(today)!;
  const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0));
  const from = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY);
  const to = new Date(last.getTime() + (6 - ((last.getUTCDay() + 6) % 7)) * DAY);
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);
  const days: CalendarDay[] = [];
  for (let d = from; d <= to; d = new Date(d.getTime() + DAY)) {
    const k = iso(d);
    days.push({ day: k, inMonth: d.getUTCMonth() === t.getUTCMonth(), count: counts.get(k) ?? 0, today: k === today });
  }
  const title = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  return { title: title.charAt(0).toUpperCase() + title.slice(1), days };
}
