import type { Recommendations } from "@/lib/ai/recommendations";
import { requireContext } from "@/lib/context";
import { answersFromProfile } from "@/lib/diagnostic";
import type { Benchmark, Maturity } from "@/lib/maturity";
import { withDefaults } from "@/lib/profile";
import type { Answers } from "@/lib/questionnaire";
import { ProfileWizard } from "./ProfileWizard";

export const metadata = { title: "Diagnostic" };

export default async function ProfilePage() {
  const ctx = await requireContext();
  const { data } = await ctx.supabase.from("company_profiles")
    .select("data, answers, summary, validated_at, maturity, recommendations").eq("org_id", ctx.org.id).maybeSingle();
  const answers = (data?.answers ?? {}) as Answers;
  // Profil saisi avec l'ancien formulaire: il préremplit le questionnaire.
  const legacy = data?.data && typeof data.data === "object" && "sector" in data.data && (data.data as { sector?: string }).sector;
  const initialAnswers = legacy
    ? answersFromProfile(withDefaults({ name: ctx.org.name, country: ctx.org.country, currency: ctx.org.currency, ...data.data }), answers)
    : { company_name: ctx.org.name, country: ctx.org.country, ...answers };
  const maturity = (data?.maturity ?? null) as Maturity | null;
  const benchmark = maturity
    ? ((await ctx.supabase.rpc("sector_benchmark", { org: ctx.org.id }).maybeSingle()).data as Benchmark | null)
    : null;
  return (
    <ProfileWizard
      initialAnswers={initialAnswers}
      savedSummary={data?.summary ?? null}
      validatedAt={data?.validated_at ?? null}
      maturity={maturity}
      benchmark={benchmark}
      recommendations={(data?.recommendations ?? null) as Recommendations | null}
      bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL || null}
    />
  );
}
