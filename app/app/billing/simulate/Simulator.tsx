"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

export function Simulator({ tx }: { tx: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const decide = async (decision: "accept" | "refuse") => {
    try {
      await api("/api/billing/simulate", "POST", { tx, decision });
      router.push(`/app/billing/return?tx=${tx}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="row">
      <button onClick={() => decide("accept")}>Simuler un paiement accepté</button>
      <button className="ghost" onClick={() => decide("refuse")}>Simuler un refus</button>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
