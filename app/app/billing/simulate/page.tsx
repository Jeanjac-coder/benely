import { notFound } from "next/navigation";
import { SIMULATION } from "@/lib/billing/server";
import { Simulator } from "./Simulator";

/** Page de paiement simulé, disponible uniquement hors production avec BILLING_PROVIDER=simulation. */
export default function SimulatePage({ searchParams }: { searchParams: { tx?: string } }) {
  if (!SIMULATION || !searchParams.tx) notFound();
  return <><h1>Paiement simulé</h1><div className="card"><p className="muted">Environnement de test: aucun débit réel.</p><Simulator tx={searchParams.tx} /></div></>;
}
