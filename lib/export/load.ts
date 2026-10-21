import "server-only";
import type { OrgContext } from "../context";
import { readLogo, type Logo } from "./model";

/** Logo de l'organisation depuis le stockage (lecture soumise à la RLS du stockage). */
export async function loadLogo(ctx: OrgContext): Promise<Logo | null> {
  const { data: org } = await ctx.supabase.from("organizations").select("logo_path").eq("id", ctx.org.id).single();
  if (!org?.logo_path) return null;
  const { data } = await ctx.supabase.storage.from("logos").download(org.logo_path);
  return data ? readLogo(new Uint8Array(await data.arrayBuffer())) : null;
}
