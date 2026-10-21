-- Recette T11 (isolation inter-organisations). Échoue avec une exception au premier écart.
\set ON_ERROR_STOP on
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'awa@a.ci'),
  ('00000000-0000-0000-0000-00000000000b', 'bakary@b.ci'),
  ('00000000-0000-0000-0000-00000000000c', 'chloe@a.ci');

set role authenticated;

-- A crée son organisation et une stratégie
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set request.jwt.claim.email = 'awa@a.ci';
select public.create_organization('Org A') as org_a \gset
insert into strategies (org_id, title, created_by) values (:'org_a', 'Strat A', auth.uid()) returning id as strat_a \gset
insert into invitations (org_id, email, role, invited_by) values (:'org_a', 'chloe@a.ci', 'member', auth.uid()) returning token as tok \gset

-- B crée la sienne
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
set request.jwt.claim.email = 'bakary@b.ci';
select public.create_organization('Org B') as org_b \gset

do $$ begin
  if (select count(*) from organizations) <> 1 then raise exception 'B voit une autre organisation'; end if;
  if (select count(*) from strategies) <> 0 then raise exception 'B voit la stratégie de A'; end if;
  if (select count(*) from company_profiles) <> 1 then raise exception 'B voit le profil de A'; end if;
  if (select count(*) from invitations) <> 0 then raise exception 'B voit les invitations de A'; end if;
end $$;

-- B ne peut ni écrire dans A, ni rattacher une version à la stratégie de A
do $$ begin
  begin
    insert into strategies (org_id, title, created_by)
      values ((select id from organizations limit 1)::uuid, 'x', auth.uid());
  exception when others then null; end;
end $$;
\set ON_ERROR_STOP off
insert into strategies (org_id, title, created_by) values (:'org_a', 'intrusion', auth.uid());
insert into strategy_versions (strategy_id, org_id, version, deliverables, source, created_by)
  values (:'strat_a', :'org_b', 1, '{}', 'edit', auth.uid());
update company_profiles set summary = 'piraté' where org_id = :'org_a';
select public.accept_invitation(:'tok');
\set ON_ERROR_STOP on

-- C (invitée) accepte et rejoint A en membre
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
set request.jwt.claim.email = 'chloe@a.ci';
select public.accept_invitation(:'tok');
\set ON_ERROR_STOP off
-- un membre ne peut pas inviter ni se promouvoir
insert into invitations (org_id, email, role, invited_by) values (:'org_a', 'x@x.ci', 'admin', auth.uid());
update memberships set role = 'admin' where user_id = auth.uid();
\set ON_ERROR_STOP on

reset role;
do $$ begin
  if exists (select 1 from strategies where title = 'intrusion') then raise exception 'écriture inter-org acceptée'; end if;
  if exists (select 1 from strategy_versions) then raise exception 'version rattachée à une stratégie étrangère'; end if;
  if exists (select 1 from company_profiles where summary = 'piraté') then raise exception 'profil étranger modifié'; end if;
  if (select role from memberships where user_id = '00000000-0000-0000-0000-00000000000c') <> 'member' then raise exception 'escalade de rôle'; end if;
  if (select count(*) from memberships where user_id = '00000000-0000-0000-0000-00000000000b') <> 1 then raise exception 'B a rejoint A'; end if;
  if (select count(*) from invitations) <> 1 then raise exception 'un membre a créé une invitation'; end if;
  if (select email from memberships where user_id = '00000000-0000-0000-0000-00000000000c') <> 'chloe@a.ci' then raise exception 'e-mail du membre non enregistré'; end if;
  if has_function_privilege('anon', 'public.create_organization(text, text, text)', 'execute')
     or has_function_privilege('anon', 'public.accept_invitation(uuid)', 'execute')
     or has_function_privilege('anon', 'public.is_member(uuid)', 'execute') then
    raise exception 'fonction privilégiée appelable sans connexion';
  end if;
  raise notice 'RLS: tous les contrôles passent';
end $$;
