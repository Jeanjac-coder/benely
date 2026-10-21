"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "reset" | "update";

const TITLES: Record<Mode, string> = { login: "Bon retour", signup: "Créer un compte", reset: "Mot de passe oublié", update: "Nouveau mot de passe" };
const SUBTITLES: Record<Mode, string> = {
  login: "Connectez-vous pour retrouver votre stratégie.",
  signup: "14 jours d'essai gratuit, sans carte bancaire.",
  reset: "Nous vous envoyons un lien de réinitialisation.",
  update: "Choisissez un nouveau mot de passe (8 caractères minimum).",
};
const ACTIONS: Record<Mode, string> = { login: "Se connecter", signup: "Créer mon compte", reset: "Envoyer le lien", update: "Enregistrer" };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(params.get("error") ? { ok: false, text: "Lien invalide ou expiré." } : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const supabase = supabaseBrowser();
    const callback = (next: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(params.get("next") ?? "/app");
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback(params.get("next") ?? "/onboarding") } });
        if (error) throw error;
        setMsg({ ok: true, text: "Compte créé. Confirmez votre adresse via le lien reçu par e-mail." });
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback("/auth/update-password") });
        if (error) throw error;
        setMsg({ ok: true, text: "Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé." });
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        router.replace("/app");
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={TITLES[mode]} subtitle={SUBTITLES[mode]}>
      <form onSubmit={submit}>
        {mode !== "update" && (<><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></>)}
        {mode !== "reset" && (<><label htmlFor="password">Mot de passe</label><input id="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></>)}
        <button disabled={busy} className="btn-lg" style={{ marginTop: 20, width: "100%" }}>{busy ? "Patientez…" : ACTIONS[mode]}</button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
      </form>
      <p className="small" style={{ marginTop: 20 }}>
        {mode === "login" && <>Pas encore de compte ? <Link href="/auth/signup">Créer un compte</Link> · <Link href="/auth/reset">Mot de passe oublié</Link></>}
        {mode === "signup" && <>Déjà inscrit ? <Link href="/auth/login">Se connecter</Link></>}
        {(mode === "reset" || mode === "update") && <Link href="/auth/login">Retour à la connexion</Link>}
      </p>
    </AuthLayout>
  );
}
