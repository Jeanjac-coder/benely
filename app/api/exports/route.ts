import { NextResponse } from "next/server";
import { STEPS, type Step } from "@/lib/ai/schemas";
import { checkQuota, recordQuotaUse } from "@/lib/billing/server";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";
import { renderDocx } from "@/lib/export/docx";
import { loadLogo } from "@/lib/export/load";
import { buildDoc, fileName } from "@/lib/export/model";
import { renderPdf } from "@/lib/export/pdf";
import { renderXlsx } from "@/lib/export/xlsx";
import { latestStrategy } from "@/lib/repo";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMATS = {
  pdf: { render: renderPdf, type: "application/pdf" },
  docx: { render: renderDocx, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { render: renderXlsx, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
} as const;

/** T09: GET /api/exports?format=pdf|docx|xlsx&sections=all|diagnostic,market,… */
export async function GET(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") as keyof typeof FORMATS;
  if (!FORMATS[format]) return jsonError("Format inconnu.");
  const raw = url.searchParams.get("sections") ?? "all";
  const steps = raw === "all" ? [...STEPS] : raw.split(",").filter((s): s is Step => (STEPS as readonly string[]).includes(s));
  if (steps.length === 0) return jsonError("Aucun livrable sélectionné.");

  const current = await latestStrategy(ctx);
  if (!current) return jsonError("Aucune stratégie à exporter.", 404);
  const quota = await checkQuota(ctx, "exports");
  if (quota) return jsonError(quota, 402);

  try {
    const doc = buildDoc(current.version.deliverables, { company: ctx.org.name, version: current.version.version, logo: await loadLogo(ctx) }, steps);
    const body = await FORMATS[format].render(doc);
    await recordQuotaUse(ctx, "exports");
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": FORMATS[format].type,
        "Content-Disposition": `attachment; filename="${fileName(ctx.org.name, format)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    await logEvent("error", "export", `Export ${format} impossible`, { orgId: ctx.org.id, details: { error: e } });
    return jsonError("L'export a échoué. Réessayez ou contactez le support.", 500);
  }
}
