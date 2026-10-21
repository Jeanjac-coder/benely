"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

type Props = { planId: string; priced: boolean; renew: boolean; cancel?: never } | { cancel: boolean; planId?: never; priced?: never; renew?: never };

export function BillingActions(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(planId: string) {
    setBusy(true); setError("");
    try {
      const { paymentUrl } = await api<{ paymentUrl: string }>("/api/billing/checkout", "POST", { planId });
      window.location.assign(paymentUrl);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function toggleCancel(value: boolean) {
    if (value && !confirm("Résilier l'abonnement ? L'accès reste ouvert jusqu'à la fin de la période payée.")) return;
    setBusy(true); setError("");
    try {
      await api("/api/billing/cancel", "POST", { value });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (props.cancel !== undefined) {
    return (
      <>
        {props.cancel
          ? <button onClick={() => toggleCancel(false)} disabled={busy}>Reprendre l'abonnement</button>
          : <button className="ghost" onClick={() => toggleCancel(true)} disabled={busy}>Résilier en fin de période</button>}
        {error && <p className="err">{error}</p>}
      </>
    );
  }
  if (!props.priced) return <p className="small"><a href="mailto:contact@benely.africa">Nous contacter</a></p>;
  return (
    <>
      <button onClick={() => pay(props.planId)} disabled={busy}>{busy ? "Redirection…" : props.renew ? "Renouveler (1 mois)" : "Choisir cette offre"}</button>
      <p className="muted small">Orange Money, MTN MoMo, Moov Money, Wave ou carte bancaire.</p>
      {error && <p className="err">{error}</p>}
    </>
  );
}
