"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type State = { status: string; failure_reason?: string | null } | null;

function ReturnStatus() {
  const tx = useSearchParams().get("tx");
  const router = useRouter();
  const [state, setState] = useState<State>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!tx) return;
    let stop = false;
    // Le prestataire peut confirmer avec retard: on revérifie pendant environ deux minutes.
    const poll = async (n: number) => {
      const r = await fetch(`/api/billing/payments/${tx}`).then((x) => x.json()).catch(() => null);
      if (stop) return;
      setState(r); setTries(n);
      if (r?.status === "pending" && n < 24) setTimeout(() => poll(n + 1), 5000);
      if (r?.status === "accepted") router.refresh();
    };
    poll(1);
    return () => { stop = true; };
  }, [tx, router]);

  if (!tx) return <p className="err">Transaction inconnue.</p>;
  if (!state) return <p>Vérification du paiement…</p>;
  if (state.status === "accepted") return <><p className="ok">Paiement confirmé: votre abonnement est actif.</p><Link href="/app/billing">Voir l'abonnement</Link></>;
  if (state.status === "pending") return <p aria-live="polite">Paiement en attente de confirmation par l'opérateur… {tries >= 24 && "La confirmation prend du temps: elle sera prise en compte automatiquement dès réception."}</p>;
  return <><p className="err">Le paiement n'a pas abouti{state.failure_reason ? `: ${state.failure_reason}` : "."}</p><Link href="/app/billing">Réessayer</Link></>;
}

export default function ReturnPage() {
  return <><h1>Paiement</h1><div className="card"><Suspense><ReturnStatus /></Suspense></div></>;
}
