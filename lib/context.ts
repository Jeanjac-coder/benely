import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { currentUser, supabaseServer } from "./supabase/server";

export const ORG_COOKIE = "benely_org";
export type Role = "owner" | "admin" | "member";

export interface OrgContext {
  supabase: ReturnType<typeof supabaseServer>;
  userId: string;
  email: string;
  /** Prénom et nom (table profiles), vides si non renseignés. */
  firstName: string;
  lastName: string;
  org: { id: string; name: string; country: string; currency: string };
  role: Role;
  orgs: { id: string; name: string; role: Role }[];
}

/**
 * Utilisateur connecté et organisation active (cookie, sinon la première).
 * Toutes les requêtes passent ensuite par le client Supabase de l'utilisateur: la RLS garantit l'isolation.
 */
export async function getContext(): Promise<OrgContext | null> {
  const supabase = supabaseServer();
  const user = await currentUser(supabase);
  if (!user) return null;
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase.from("memberships").select("role, organizations(id, name, country, currency)").eq("user_id", user.id).order("created_at"),
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle(),
  ]);
  const orgs = (rows ?? []).flatMap((r) => {
    const o = r.organizations as unknown as OrgContext["org"] | null;
    return o ? [{ ...o, role: r.role as Role }] : [];
  });
  if (orgs.length === 0) return null;
  const wanted = cookies().get(ORG_COOKIE)?.value;
  const active = orgs.find((o) => o.id === wanted) ?? orgs[0];
  return {
    supabase, userId: user.id, email: user.email,
    firstName: profile?.first_name ?? "", lastName: profile?.last_name ?? "",
    org: { id: active.id, name: active.name, country: active.country, currency: active.currency },
    role: active.role,
    orgs: orgs.map((o) => ({ id: o.id, name: o.name, role: o.role })),
  };
}

/** Pour les pages: redirige vers la connexion ou l'onboarding si nécessaire. */
export async function requireContext(): Promise<OrgContext> {
  const ctx = await getContext();
  if (ctx) return ctx;
  redirect((await currentUser()) ? "/onboarding" : "/auth/login");
}

/** Pour les routes API: renvoie le contexte ou une réponse d'erreur JSON. */
export async function apiContext(roles?: Role[]): Promise<OrgContext | NextResponse> {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: "Non authentifié ou sans organisation." }, { status: 401 });
  if (roles && !roles.includes(ctx.role)) return NextResponse.json({ error: "Droits insuffisants." }, { status: 403 });
  return ctx;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
