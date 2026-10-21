import { requireContext } from "@/lib/context";
import { withDefaults } from "@/lib/profile";
import { ProfileWizard } from "./ProfileWizard";

export default async function ProfilePage() {
  const ctx = await requireContext();
  const { data } = await ctx.supabase.from("company_profiles").select("data, answers, summary, validated_at").eq("org_id", ctx.org.id).maybeSingle();
  const initial = withDefaults({ name: ctx.org.name, country: ctx.org.country, currency: ctx.org.currency, ...(data?.data ?? {}) });
  return <ProfileWizard initial={initial} initialAnswers={data?.answers ?? {}} savedSummary={data?.summary ?? null} validatedAt={data?.validated_at ?? null} />;
}
