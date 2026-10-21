-- Benely — profils utilisateurs (prénom, nom), remplis à l'inscription (formulaire ou Google).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now()
);

-- Extrait prénom et nom des métadonnées: formulaire (first_name, last_name) ou Google (given_name, family_name, full_name).
create or replace function public.profile_names(meta jsonb, out first_name text, out last_name text)
language sql immutable set search_path = '' as $$
  select
    coalesce(nullif(trim(meta ->> 'first_name'), ''), nullif(trim(meta ->> 'given_name'), ''),
             nullif(split_part(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), ' ', 1), ''), ''),
    coalesce(nullif(trim(meta ->> 'last_name'), ''), nullif(trim(meta ->> 'family_name'), ''),
             nullif(trim(substr(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')),
               length(split_part(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), ' ', 1)) + 1)), ''), '');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare n record;
begin
  select * into n from profile_names(coalesce(new.raw_user_meta_data, '{}'::jsonb));
  insert into profiles (id, first_name, last_name, avatar_url)
    values (new.id, left(n.first_name, 80), left(n.last_name, 80), new.raw_user_meta_data ->> 'avatar_url')
    on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Utilisateurs existants
insert into public.profiles (id, first_name, last_name, avatar_url)
  select u.id, left(n.first_name, 80), left(n.last_name, 80), u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u, lateral public.profile_names(coalesce(u.raw_user_meta_data, '{}'::jsonb)) n
  on conflict (id) do nothing;

-- Partage une organisation avec l'utilisateur courant (pour afficher les noms de l'équipe).
create or replace function public.shares_org(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships a join memberships b on a.org_id = b.org_id
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select
  using (id = (select auth.uid()) or public.shares_org(id));
create policy profiles_update on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.shares_org(uuid) from public, anon;
grant execute on function public.shares_org(uuid) to authenticated;
