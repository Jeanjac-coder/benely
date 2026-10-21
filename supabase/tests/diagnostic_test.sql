-- Diagnostic: benchmark anonymisé (seuil de 5 entreprises, hors appelant) et demandes de rendez-vous.
\set ON_ERROR_STOP on
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'a@a.ci'), ('00000000-0000-0000-0000-0000000000e2', 'b@b.ci');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
set request.jwt.claim.email = 'a@a.ci';
select public.create_organization('Org A') as org_a \gset
update company_profiles set maturity_score = 40, benchmark_sector = 'Commerce' where org_id = :'org_a';
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set request.jwt.claim.email = 'b@b.ci';
select public.create_organization('Org B') as org_b \gset
reset role;

-- 4 autres entreprises du secteur: sous le seuil, aucune moyenne publiée.
insert into organizations (id, name, country, currency, created_by) select gen_random_uuid(), 'Peer ' || g, 'CI', 'XOF', '00000000-0000-0000-0000-0000000000e2' from generate_series(1, 6) g;
insert into company_profiles (org_id, maturity_score, benchmark_sector)
  select id, 60, 'Commerce' from organizations where name in ('Peer 1', 'Peer 2', 'Peer 3', 'Peer 4')
  on conflict (org_id) do update set maturity_score = excluded.maturity_score, benchmark_sector = excluded.benchmark_sector;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
set request.jwt.claim.email = 'a@a.ci';
do $$ declare b record; begin
  select * into b from public.sector_benchmark((select org_id from memberships where user_id = auth.uid()));
  if b.sector <> 'Commerce' or b.sector_companies <> 4 or b.sector_average is not null then raise exception 'seuil de 5 non respecté: %', b; end if;
end $$;
reset role;
insert into company_profiles (org_id, maturity_score, benchmark_sector)
  select id, 80, 'Commerce' from organizations where name = 'Peer 5'
  on conflict (org_id) do update set maturity_score = excluded.maturity_score, benchmark_sector = excluded.benchmark_sector;
set role authenticated;
do $$ declare b record; begin
  select * into b from public.sector_benchmark((select org_id from memberships where user_id = auth.uid()));
  -- 4 × 60 + 80 = 64 de moyenne; l'entreprise appelante (40) est exclue.
  if b.sector_companies <> 5 or b.sector_average <> 64 then raise exception 'moyenne sectorielle: %', b; end if;
end $$;

-- Un utilisateur ne peut pas obtenir le benchmark d'une autre organisation.
do $$ declare b record; begin
  select * into b from public.sector_benchmark((select id from organizations where name = 'Peer 1'));
  if b.sector is not null or b.sector_companies <> 0 then raise exception 'benchmark d''une organisation étrangère'; end if;
end $$;

-- Rendez-vous: création pour sa propre organisation uniquement, statut imposé.
insert into consultation_requests (org_id, preferred_date, preferred_slot, channel, phone, topic)
  values (:'org_a', current_date + 2, 'matin', 'whatsapp', '+225 07 00 00 00', 'Stratégie de lancement');
do $$ begin
  begin
    insert into consultation_requests (org_id, preferred_date, preferred_slot, channel) values ((select id from organizations where name = 'Peer 1'), current_date, 'matin', 'visio');
    raise exception 'demande créée pour une autre organisation';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into consultation_requests (org_id, preferred_date, preferred_slot, channel, status) values ((select org_id from memberships where user_id = auth.uid()), current_date, 'matin', 'visio', 'confirmee');
    raise exception 'statut imposé par le client';
  exception when insufficient_privilege then null;
  end;
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set request.jwt.claim.email = 'b@b.ci';
do $$ begin
  if exists (select 1 from consultation_requests) then raise exception 'voit les rendez-vous d''une autre organisation'; end if;
  if has_function_privilege('anon', 'public.sector_benchmark(uuid)', 'execute') then raise exception 'benchmark appelable sans connexion'; end if;
  raise notice 'Diagnostic: tous les contrôles passent';
end $$;
