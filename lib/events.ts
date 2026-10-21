import "server-only";
import { supabaseAdmin } from "./supabase/admin";

export type EventLevel = "info" | "warning" | "error";

/** Incident ou trace technique, consultable dans l'administration. N'échoue jamais. */
export async function logEvent(level: EventLevel, category: string, message: string, opts: { orgId?: string | null; details?: unknown } = {}) {
  const line = { level, category, message, orgId: opts.orgId ?? null };
  (level === "error" ? console.error : console.log)("[event]", line, opts.details ?? "");
  try {
    await supabaseAdmin().from("app_events").insert({
      level, category, message, org_id: opts.orgId ?? null, details: JSON.parse(JSON.stringify(opts.details ?? {}, errorReplacer)),
    });
  } catch {
    // La journalisation ne doit jamais faire échouer l'action en cours.
  }
}

function errorReplacer(_: string, v: unknown) {
  return v instanceof Error ? { name: v.name, message: v.message } : v;
}
