-- Benely — durcissement après audit Supabase (sécurité et performance)

-- Aucune fonction privilégiée n'est appelable sans être connecté.
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.has_role(uuid, public.org_role[]) from public, anon;
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.create_organization(text, text, text) from public, anon;
revoke execute on function public.accept_invitation(uuid) from public, anon;
revoke execute on function public.set_cancel_at_period_end(uuid, boolean) from public, anon;
-- Fonction de déclencheur: jamais appelée directement.
revoke execute on function public.start_trial() from public, anon, authenticated;

-- Utilisateurs connectés: fonctions utilisées par les politiques RLS et par l'application.
-- Chacune vérifie elle-même l'identité (auth.uid()) et les droits.
grant execute on function public.is_member(uuid) to authenticated, service_role;
grant execute on function public.has_role(uuid, public.org_role[]) to authenticated, service_role;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.create_organization(text, text, text) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.set_cancel_at_period_end(uuid, boolean) to authenticated;

-- auth.uid() évalué une seule fois par requête plutôt qu'à chaque ligne.
alter policy inv_all on public.invitations
  using (public.has_role(org_id, '{owner,admin}'))
  with check (public.has_role(org_id, '{owner,admin}') and invited_by = (select auth.uid()));
alter policy pay_create on public.payments
  with check (public.has_role(org_id, '{owner,admin}') and status = 'pending' and created_by = (select auth.uid()));
alter policy usage_insert on public.usage_events
  with check (public.is_member(org_id) and user_id = (select auth.uid()));
alter policy admins_self on public.platform_admins using (user_id = (select auth.uid()));

-- Index des requêtes courantes (filtrage par organisation et par date).
create index if not exists ai_usage_org_created_idx on public.ai_usage (org_id, created_at);
create index if not exists ai_usage_job_idx on public.ai_usage (job_id);
create index if not exists invitations_org_idx on public.invitations (org_id);
create index if not exists invoices_org_idx on public.invoices (org_id, issued_at desc);
create index if not exists performance_entries_org_idx on public.performance_entries (org_id);
create index if not exists strategy_versions_org_idx on public.strategy_versions (org_id);
create index if not exists generation_jobs_strategy_idx on public.generation_jobs (strategy_id, org_id);
create index if not exists app_events_org_idx on public.app_events (org_id);
