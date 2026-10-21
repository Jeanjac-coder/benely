"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import { AuthLayout } from "@/components/AuthLayout";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/africa";

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/orgs", "POST", { name, country });
      router.replace("/app/profile");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Votre organisation" subtitle="Votre essai gratuit de 14 jours démarre dès la création.">
      <form onSubmit={submit}>
        <label htmlFor="name">Nom de l'entreprise ou de l'agence</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="country">Pays principal</label>
        <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
          {Object.entries(COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
        </select>
        <button disabled={busy} className="btn-lg" style={{ marginTop: 20, width: "100%" }}>Créer mon organisation</button>
        {error && <p className="err">{error}</p>}
      </form>
    </AuthLayout>
  );
}
