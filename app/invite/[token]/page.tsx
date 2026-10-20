"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <main style={{ maxWidth: 480 }}>
      <h1>Invitation</h1>
      <div className="card">
        <p>Vous avez été invité(e) à rejoindre une organisation sur Benely.</p>
        <button onClick={accept}>Rejoindre</button>
        {error && <p className="err">{error}</p>}
      </div>
    </main>
  );
}
