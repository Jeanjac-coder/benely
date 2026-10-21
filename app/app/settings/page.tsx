import { requireContext } from "@/lib/context";
import { LogoForm } from "./LogoForm";

export default async function SettingsPage() {
  const ctx = await requireContext();
  const { data: org } = await ctx.supabase.from("organizations").select("logo_path").eq("id", ctx.org.id).single();
  let logoUrl: string | null = null;
  if (org?.logo_path) {
    const { data } = await ctx.supabase.storage.from("logos").createSignedUrl(org.logo_path, 300);
    logoUrl = data?.signedUrl ?? null;
  }
  return (
    <>
      <h1>Paramètres — {ctx.org.name}</h1>
      <div className="card">
        <h2>Logo des exports</h2>
        <p className="muted small">Le logo et le nom de l'entreprise figurent sur la couverture des exports PDF, Word et Excel.</p>
        {logoUrl && <img src={logoUrl} alt={`Logo ${ctx.org.name}`} style={{ maxHeight: 80, maxWidth: 240, display: "block", margin: "8px 0" }} />}
        {ctx.role === "member" ? <p className="muted">Seuls le propriétaire et les administrateurs peuvent modifier le logo.</p> : <LogoForm hasLogo={!!org?.logo_path} />}
      </div>
    </>
  );
}
