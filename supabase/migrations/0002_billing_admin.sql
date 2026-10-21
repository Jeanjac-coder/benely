-- Benely — abonnements, paiements, quotas, exports et administration (V1)

-- ---------------------------------------------------------------- Offres et quotas
-- Quotas par période d'abonnement; null = illimité. Paramétrables depuis l'administration.
create table public.plans (
  id text primary key,
  name text not null,
  price_monthly int,             -- null = sur devis
  currency text not null default 'XOF',
  quotas jsonb not null,
  public boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.plans (id, name, price_monthly, quotas, public, sort) values
  ('trial', 'Essai gratuit', 0, '{"generations": 1, "regenerations": 5, "exports": 3, "members": 1}', false, 0),
  ('starter', 'Starter', 9900, '{"generations": 2, "regenerations": 20, "exports": 10, "members": 1}', true, 1),
  ('business', 'Business', 19900, '{"generations": 6, "regenerations": 60, "exports": 50, "members": 5}', true, 2),
  ('enterprise', 'Enterprise', null, '{"generations": null, "regenerations": null, "exports": null, "members": null}', true, 3);

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create table public.subscriptions (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status public.subscription_status not null,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create type public.payment_status as enum ('pending', 'accepted', 'refused', 'cancelled', 'error');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  plan_id text not null references public.plans (id),
  transaction_id text not null unique,
  amount int not null check (amount > 0),
  currency text not null,
  status public.payment_status not null default 'pending',
  provider text not null,
  method text,
  provider_data jsonb not null default '{}',
  failure_reason text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index on public.payments (org_id, created_at desc);

create sequence public.invoice_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null unique references public.payments (id),
  number text not null unique,
  plan_id text not null references public.plans (id),
  amount int not null,
  currency text not null,
  billed_to text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  issued_at timestamptz not null default now()
);

-- Consommation des quotas (générations, régénérations, exports).
create table public.usage_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('generation', 'regeneration', 'export')),
  user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index on public.usage_events (org_id, kind, created_at);

-- Logo affiché dans les exports.
alter table public.organizations add column logo_path text;

-- ---------------------------------------------------------------- Administration
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Incidents et journaux techniques (lisibles uniquement par l'administration).
create table public.app_events (
  id bigint generated always as identity primary key,
  level text not null check (level in ('info', 'warning', 'error')),
  category text not null,
  message text not null,
  org_id uuid references public.organizations (id) on delete set null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.app_events (created_at desc);

-- Journal des opérations sensibles.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- Cycle de vie de l'abonnement
-- Toute nouvelle organisation démarre un essai de 14 jours.
create or replace function public.start_trial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into subscriptions (org_id, plan_id, status, current_period_end)
    values (new.id, 'trial', 'trialing', now() + interval '14 days');
  return new;
end $$;
create trigger organizations_start_trial after insert on public.organizations
  for each row execute function public.start_trial();

-- Activation après confirmation du prestataire: idempotente, atomique.
-- Réservée au rôle service (webhook et vérification côté serveur), jamais au navigateur.
create or replace function public.confirm_payment(tx text, pay_method text, data jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  p payments;
  s subscriptions;
  start_at timestamptz;
  org_name text;
begin
  select * into p from payments where transaction_id = tx for update;
  if p.id is null then raise exception 'paiement inconnu: %', tx; end if;
  if p.status = 'accepted' then return 'already_accepted'; end if;

  select * into s from subscriptions where org_id = p.org_id for update;
  -- Renouvellement du même plan avant échéance: la nouvelle période suit la précédente.
  start_at := case
    when s.plan_id = p.plan_id and s.status in ('active', 'past_due') and s.current_period_end > now() then s.current_period_end
    else now() end;

  update payments set status = 'accepted', method = pay_method, provider_data = data, confirmed_at = now(), failure_reason = null
    where id = p.id;
  update subscriptions set plan_id = p.plan_id, status = 'active', cancel_at_period_end = false,
    current_period_start = case when start_at = now() then now() else current_period_start end,
    current_period_end = start_at + interval '1 month', updated_at = now()
    where org_id = p.org_id;

  select name into org_name from organizations where id = p.org_id;
  insert into invoices (org_id, payment_id, number, plan_id, amount, currency, billed_to, period_start, period_end)
    values (p.org_id, p.id, 'BEN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_seq')::text, 6, '0'),
            p.plan_id, p.amount, p.currency, org_name, start_at, start_at + interval '1 month');
  return 'accepted';
end $$;

create or replace function public.fail_payment(tx text, new_status public.payment_status, reason text, data jsonb)
returns void language sql security definer set search_path = public as $$
  update payments set status = new_status, failure_reason = reason, provider_data = data
    where transaction_id = tx and status = 'pending';
$$;

-- Résiliation (effective en fin de période) et reprise, par le propriétaire.
create or replace function public.set_cancel_at_period_end(org uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(org, '{owner}') then raise exception 'réservé au propriétaire'; end if;
  update subscriptions set cancel_at_period_end = value, updated_at = now()
    where org_id = org and status in ('active', 'past_due');
end $$;

-- Mise à jour périodique des statuts (appelée par la tâche planifiée).
create or replace function public.refresh_subscription_statuses(grace interval default interval '3 days')
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; c int;
begin
  update subscriptions set status = 'expired', updated_at = now()
    where status = 'trialing' and current_period_end < now();
  get diagnostics c = row_count; n := n + c;
  update subscriptions set status = 'canceled', updated_at = now()
    where status in ('active', 'past_due') and cancel_at_period_end and current_period_end < now();
  get diagnostics c = row_count; n := n + c;
  update subscriptions set status = 'past_due', updated_at = now()
    where status = 'active' and current_period_end < now();
  get diagnostics c = row_count; n := n + c;
  update subscriptions set status = 'expired', updated_at = now()
    where status = 'past_due' and current_period_end + grace < now();
  get diagnostics c = row_count; n := n + c;
  return n;
end $$;

revoke execute on function public.confirm_payment(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.fail_payment(text, public.payment_status, text, jsonb) from public, anon, authenticated;
revoke execute on function public.refresh_subscription_statuses(interval) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, text, jsonb) to service_role;
grant execute on function public.fail_payment(text, public.payment_status, text, jsonb) to service_role;
grant execute on function public.refresh_subscription_statuses(interval) to service_role;

-- ---------------------------------------------------------------- RLS
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.usage_events enable row level security;
alter table public.platform_admins enable row level security;
alter table public.app_events enable row level security;
alter table public.audit_log enable row level security;

create policy plans_read on public.plans for select using (true);
create policy sub_read on public.subscriptions for select using (public.is_member(org_id));
create policy pay_read on public.payments for select using (public.has_role(org_id, '{owner,admin}'));
create policy pay_create on public.payments for insert
  with check (public.has_role(org_id, '{owner,admin}') and status = 'pending' and created_by = auth.uid());
create policy inv_read on public.invoices for select using (public.has_role(org_id, '{owner,admin}'));
create policy usage_read on public.usage_events for select using (public.is_member(org_id));
create policy usage_insert on public.usage_events for insert
  with check (public.is_member(org_id) and user_id = auth.uid());
create policy admins_self on public.platform_admins for select using (user_id = auth.uid());
create policy events_insert on public.app_events for insert
  with check (org_id is null or public.is_member(org_id));
-- audit_log: aucun accès client; écrit et lu par le rôle service depuis l'administration.

-- ---------------------------------------------------------------- Stockage des logos
insert into storage.buckets (id, name, public) values ('logos', 'logos', false) on conflict (id) do nothing;

create policy logos_read on storage.objects for select
  using (bucket_id = 'logos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy logos_write on storage.objects for insert
  with check (bucket_id = 'logos' and public.has_role(((storage.foldername(name))[1])::uuid, '{owner,admin}'));
create policy logos_update on storage.objects for update
  using (bucket_id = 'logos' and public.has_role(((storage.foldername(name))[1])::uuid, '{owner,admin}'));
create policy logos_delete on storage.objects for delete
  using (bucket_id = 'logos' and public.has_role(((storage.foldername(name))[1])::uuid, '{owner,admin}'));

-- Organisations créées avant cette migration: essai de 14 jours.
insert into public.subscriptions (org_id, plan_id, status, current_period_end)
  select id, 'trial', 'trialing', now() + interval '14 days' from public.organizations
  on conflict (org_id) do nothing;
