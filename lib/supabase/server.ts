import { createServerClient } from "@supabase/ssr";
import { verifyCredentials } from "@supabase/server/core";
import { cookies } from "next/headers";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Appel depuis un Server Component: le middleware se charge de rafraîchir la session.
        }
      },
    },
  });
}

export interface AuthUser { id: string; email: string }

/**
 * Utilisateur connecté. @supabase/ssr lit (et rafraîchit si besoin) la session en cookie,
 * puis @supabase/server vérifie la signature du jeton localement avec les clés publiques
 * (JWKS) du projet: pas d'aller-retour vers Supabase Auth à chaque requête.
 * Repli sur auth.getUser() si la vérification locale est impossible (clés HS256 héritées, JWKS injoignable).
 */
export async function currentUser(supabase = supabaseServer()): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await verifyCredentials(
    { token: session.access_token, apikey: null },
    { auth: "user", env: { url: process.env.NEXT_PUBLIC_SUPABASE_URL } },
  );
  if (data?.userClaims) return { id: data.userClaims.id, email: data.userClaims.email ?? "" };
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? "" } : null;
}
