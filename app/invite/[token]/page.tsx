"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { api } from "@/components/client";

export default function Invite({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function accept() {
    try {
      await api("/api/invitations/accept", "POST", { token: params.token });
      router.replace("/app");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <AuthLayout title="Invitation" subtitle="Vous avez été invité(e) à rejoindre une organisation sur Benely.">
      <button onClick={accept} className="btn-lg" style={{ width: "100%" }}>Rejoindre l'organisation</button>
      {error && <p className="err">{error}</p>}
    </AuthLayout>
  );
}
