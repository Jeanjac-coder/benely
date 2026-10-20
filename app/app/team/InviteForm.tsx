"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLink("");
    try {
      const r = await api<{ link: string }>("/api/invitations", "POST", { email, role });
      setLink(r.link); setEmail("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="grid">
        <div><label htmlFor="inv-email">E-mail</label><input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label htmlFor="inv-role">Rôle</label>
          <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value)}><option value="member">Collaborateur</option><option value="admin">Administrateur</option></select></div>
      </div>
      <button style={{ marginTop: 12 }}>Inviter</button>
      {link && <p className="ok small">Lien d'invitation à transmettre (valable 7 jours): <code>{link}</code></p>}
      {error && <p className="err">{error}</p>}
    </form>
  );
}
