-- Benely — schéma initial (V1)
-- Isolation multi-tenant: chaque table métier porte org_id et est protégée par RLS.

create extension if not exists pgcrypto;

create type public.org_role as enum ('owner', 'admin', 'member');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  country text not null default 'CI',
  currency text not null default 'XOF',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'member',
  email text,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.org_role not null default 'member' check (role <> 'owner'),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references auth.users (id),
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create table public.company_profiles (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  data jsonb not null default '{}',
  answers jsonb not null default '{}',
  summary text,
  validated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  current_version int not null default 0,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (id, org_id)
);
create index on public.strategies (org_id);

create table public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null,
  org_id uuid not null references public.organizations (id) on delete cascade,
  version int not null,
  deliverables jsonb not null,
  issues jsonb not null default '[]',
  source text not null check (source in ('generation', 'edit', 'regeneration', 'budget')),
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (strategy_id, version),
  foreign key (strategy_id, org_id) references public.strategies (id, org_id) on delete cascade
);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  strategy_id uuid,
  status public.job_status not null default 'queued',
  input jsonb not null,
  outputs jsonb not null default '{}',
  current_step text,
  error text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (strategy_id, org_id) references public.strategies (id, org_id) on delete cascade
);
create index on public.generation_jobs (org_id, created_at desc);

create table public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  strategy_id uuid not null,
  channel text not null,
  period_start date not null,
  spend numeric not null default 0 check (spend >= 0),
  conversions int not null default 0 check (conversions >= 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (strategy_id, channel, period_start),
  foreign key (strategy_id, org_id) references public.strategies (id, org_id) on delete cascade
);

-- Consommation IA, pour le suivi des coûts et des quotas par abonnement.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid references public.generation_jobs (id) on delete set null,
  step text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);

-- Helpers d'autorisation (security definer pour éviter la récursion RLS sur memberships).
create or replace function public.is_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = org and user_id = auth.uid());
$$;

create or replace function public.has_role(org uuid, roles public.org_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = org and user_id = auth.uid() and role = any (roles));
$$;

-- Création atomique d'une organisation et de son propriétaire.
create or replace function public.create_organization(org_name text, org_country text default 'CI', org_currency text default 'XOF')
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations (name, country, currency, created_by) values (org_name, org_country, org_currency, auth.uid())
    returning id into new_id;
  insert into memberships (org_id, user_id, role, email) values (new_id, auth.uid(), 'owner', auth.jwt() ->> 'email');
  insert into company_profiles (org_id) values (new_id);
  return new_id;
end $$;

-- Acceptation d'une invitation par l'utilisateur dont l'e-mail correspond.
create or replace function public.accept_invitation(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  select * into inv from invitations
    where token = invite_token and accepted_at is null and expires_at > now();
  if inv.id is null then raise exception 'invitation invalide ou expirée'; end if;
  if lower(inv.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'cette invitation est destinée à une autre adresse';
  end if;
  insert into memberships (org_id, user_id, role, email) values (inv.org_id, auth.uid(), inv.role, inv.email)
    on conflict (org_id, user_id) do nothing;
  update invitations set accepted_at = now() where id = inv.id;
  return inv.org_id;
end $$;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.company_profiles enable row level security;
alter table public.strategies enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.performance_entries enable row level security;
alter table public.ai_usage enable row level security;

create policy org_select on public.organizations for select using (public.is_member(id));
create policy org_update on public.organizations for update using (public.has_role(id, '{owner,admin}'));
create policy org_delete on public.organizations for delete using (public.has_role(id, '{owner}'));

create policy mem_select on public.memberships for select using (public.is_member(org_id));
create policy mem_update on public.memberships for update
  using (public.has_role(org_id, '{owner,admin}')) with check (role <> 'owner');
create policy mem_delete on public.memberships for delete
  using (public.has_role(org_id, '{owner,admin}') and role <> 'owner');

create policy inv_all on public.invitations for all
  using (public.has_role(org_id, '{owner,admin}'))
  with check (public.has_role(org_id, '{owner,admin}') and invited_by = auth.uid());

-- Tables métier: tout membre de l'organisation peut lire et écrire.
do $$
declare t text;
begin
  foreach t in array array['company_profiles', 'strategies', 'strategy_versions', 'generation_jobs', 'performance_entries', 'ai_usage'] loop
    execute format('create policy %I_member on public.%I for all using (public.is_member(org_id)) with check (public.is_member(org_id))', t, t);
  end loop;
end $$;
