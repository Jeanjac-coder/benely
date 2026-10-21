"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "reset" | "update";

const TITLES: Record<Mode, string> = { login: "Connexion", signup: "Créer un compte", reset: "Mot de passe oublié", update: "Nouveau mot de passe" };
const WELCOME: Record<Mode, string> = { login: "Bienvenue", signup: "Bienvenue", reset: "Pas de panique", update: "Presque fini" };
const SUBTITLES: Record<Mode, string> = {
  login: "Connectez-vous pour retrouver votre stratégie.",
  signup: "14 jours d'essai gratuit, sans carte bancaire.",
  reset: "Nous vous envoyons un lien de réinitialisation.",
  update: "Choisissez un nouveau mot de passe (8 caractères minimum).",
};
const ACTIONS: Record<Mode, string> = { login: "Se connecter", signup: "Créer mon compte", reset: "Envoyer le lien", update: "Enregistrer" };

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(params.get("error") ? { ok: false, text: "Lien invalide ou expiré." } : null);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const next = params.get("next") ?? (mode === "signup" ? "/onboarding" : "/app");
  const callback = (to: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  async function google() {
    setBusy("google"); setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(next) } });
    if (error) { setMsg({ ok: false, text: "La connexion avec Google n'est pas disponible pour le moment." }); setBusy(null); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("form"); setMsg(null);
    const supabase = supabaseBrowser();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
        return;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: callback(next), data: { first_name: firstName.trim(), last_name: lastName.trim() } },
        });
        if (error) throw error;
        setMsg({ ok: true, text: `Merci ${firstName.trim()} ! Confirmez votre adresse via le lien reçu par e-mail.` });
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback("/auth/update-password") });
        if (error) throw error;
        setMsg({ ok: true, text: "Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé." });
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        router.replace("/app");
        return;
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
    setBusy(null);
  }

  const withGoogle = mode === "login" || mode === "signup";
  return (
    <AuthLayout title={TITLES[mode]} subtitle={SUBTITLES[mode]} welcome={WELCOME[mode]}>
      {withGoogle && (
        <>
          <div className="oauth">
            <button type="button" className="btn-google" onClick={google} disabled={busy !== null}>
              {busy === "google" ? <span className="spinner" /> : <GoogleIcon />} Continuer avec Google
            </button>
          </div>
          <div className="divider">ou avec votre e-mail</div>
        </>
      )}
      <form onSubmit={submit}>
        {mode === "signup" && (
          <div className="grid">
            <div><label htmlFor="first">Prénom</label><input id="first" autoComplete="given-name" required maxLength={80} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><label htmlFor="last">Nom</label><input id="last" autoComplete="family-name" required maxLength={80} value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
        )}
        {mode !== "update" && (<><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></>)}
        {mode !== "reset" && (<><label htmlFor="password">Mot de passe</label><input id="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></>)}
        <button disabled={busy !== null} className="btn-lg btn-block" style={{ marginTop: 20 }}>
          {busy === "form" ? <><span className="spinner" /> Patientez…</> : ACTIONS[mode]}
        </button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
      </form>
      <p className="auth-links">
        {mode === "login" && <>Pas encore de compte ? <Link href="/auth/signup">Créer un compte</Link><Link href="/auth/reset">Mot de passe oublié</Link></>}
        {mode === "signup" && <>Déjà inscrit ? <Link href="/auth/login">Se connecter</Link></>}
        {(mode === "reset" || mode === "update") && <Link href="/auth/login">Retour à la connexion</Link>}
      </p>
    </AuthLayout>
  );
}
