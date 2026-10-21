-- Diagnostic stratégique: score de maturité, benchmark sectoriel anonymisé, recommandations et rendez-vous.

alter table public.company_profiles
  add column maturity jsonb,
  add column maturity_score int check (maturity_score between 0 and 100),
  add column benchmark_sector text,
  add column recommendations jsonb,
  add column recommendations_at timestamptz;
create index company_profiles_benchmark_idx on public.company_profiles (benchmark_sector) where maturity_score is not null;

-- Benchmark: uniquement des agrégats, calculés sur les autres entreprises, et seulement
-- à partir de 5 entreprises comparables (en dessous, les valeurs restent nulles).
create or replace function public.sector_benchmark(org uuid)
returns table (sector text, sector_companies int, sector_average int, sector_p25 int, sector_p75 int, all_companies int, all_average int)
language sql stable security definer set search_path = public as $$
  with me as (
    select benchmark_sector from company_profiles where org_id = org and public.is_member(org)
  ),
  others as (
    select cp.benchmark_sector, cp.maturity_score from company_profiles cp
    where cp.maturity_score is not null and cp.org_id <> org and exists (select 1 from me)
  ),
  peers as (select o.maturity_score from others o, me where o.benchmark_sector = me.benchmark_sector)
  select
    (select benchmark_sector from me),
    (select count(*)::int from peers),
    (select case when count(*) >= 5 then round(avg(maturity_score))::int end from peers),
    (select case when count(*) >= 5 then round(percentile_cont(0.25) within group (order by maturity_score))::int end from peers),
    (select case when count(*) >= 5 then round(percentile_cont(0.75) within group (order by maturity_score))::int end from peers),
    (select count(*)::int from others),
    (select case when count(*) >= 5 then round(avg(maturity_score))::int end from others);
$$;
revoke execute on function public.sector_benchmark(uuid) from public, anon;
grant execute on function public.sector_benchmark(uuid) to authenticated;

-- Demandes d'échange stratégique avec un consultant Benely.
create table public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  preferred_date date not null,
  preferred_slot text not null check (preferred_slot in ('matin', 'midi', 'apres-midi', 'soir')),
  channel text not null check (channel in ('visio', 'telephone', 'whatsapp')),
  phone text check (char_length(phone) <= 40),
  topic text check (char_length(topic) <= 1000),
  status text not null default 'nouvelle' check (status in ('nouvelle', 'confirmee', 'realisee', 'annulee')),
  created_at timestamptz not null default now()
);
create index consultation_requests_org_idx on public.consultation_requests (org_id);
alter table public.consultation_requests enable row level security;
-- Les membres créent et consultent les demandes de leur organisation; le suivi se fait depuis l'administration.
create policy consult_select on public.consultation_requests for select using ((select public.is_member(org_id)));
create policy consult_insert on public.consultation_requests for insert
  with check ((select public.is_member(org_id)) and user_id = (select auth.uid()) and status = 'nouvelle');
