import { NextResponse } from "next/server";
import { checkCoherence } from "@/lib/ai/coherence";
import { DeliverablesSchema, type Deliverables } from "@/lib/ai/schemas";
import { upgradeDeliverables } from "@/lib/ai/upgrade";
import { normalizeShares } from "@/lib/budget";
import { apiContext, jsonError } from "@/lib/context";
import { saveVersion } from "@/lib/repo";

/** T08: une modification manuelle crée une nouvelle version (l'historique est conservé). */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => null);
  const parsed = DeliverablesSchema.safeParse(body?.deliverables ? upgradeDeliverables(body.deliverables) : undefined);
  if (!parsed.success) return jsonError(`Contenu invalide: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  const d = parsed.data as Deliverables;
  const deliverables = { ...d, media: { ...d.media, channels: normalizeShares(d.media.channels) } };
  try {
    const version = await saveVersion(ctx, params.id, deliverables, checkCoherence(deliverables), "edit", typeof body.note === "string" ? body.note : null);
    return NextResponse.json({ version });
  } catch (e) {
    return jsonError((e as Error).message, 409);
  }
}
