import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/strategy";
import type { CompanyProfile } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée côté serveur." }, { status: 500 });
  }
  let profile: CompanyProfile;
  try {
    profile = (await req.json()) as CompanyProfile;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  if (!profile?.name || !profile.sector || !profile.country || !(profile.monthlyBudget > 0)) {
    return NextResponse.json({ error: "Nom, secteur, pays et budget (> 0) sont requis." }, { status: 400 });
  }
  try {
    return NextResponse.json({ strategy: await generateStrategy(profile) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Échec de la génération de la stratégie." }, { status: 502 });
  }
}
