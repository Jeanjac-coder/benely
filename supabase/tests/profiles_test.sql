-- Profils: remplissage à l'inscription (formulaire et Google) et confidentialité.
\set ON_ERROR_STOP on
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'awa@a.ci', '{"first_name": " Awa ", "last_name": "Koné"}'),
  ('00000000-0000-0000-0000-0000000000d2', 'kofi@g.ci', '{"full_name": "Kofi Yao Mensah", "avatar_url": "https://x/y.png"}'),
  ('00000000-0000-0000-0000-0000000000d3', 'ines@b.ci', '{"given_name": "Inès", "family_name": "Diallo"}'),
  ('00000000-0000-0000-0000-0000000000d4', 'x@c.ci', '{}');
do $$ begin
  if (select first_name || '|' || last_name from profiles where id = '00000000-0000-0000-0000-0000000000d1') <> 'Awa|Koné' then raise exception 'profil formulaire'; end if;
  if (select first_name || '|' || last_name from profiles where id = '00000000-0000-0000-0000-0000000000d2') <> 'Kofi|Yao Mensah' then raise exception 'profil Google full_name'; end if;
  if (select first_name || '|' || last_name from profiles where id = '00000000-0000-0000-0000-0000000000d3') <> 'Inès|Diallo' then raise exception 'profil Google given/family'; end if;
  if (select first_name || '|' || last_name from profiles where id = '00000000-0000-0000-0000-0000000000d4') <> '|' then raise exception 'profil vide'; end if;
end $$;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
set request.jwt.claim.email = 'awa@a.ci';
select public.create_organization('Org A') as org \gset
do $$ begin
  if (select count(*) from profiles) <> 1 then raise exception 'voit des profils étrangers'; end if;
end $$;
update profiles set first_name = 'Awa Marie' where id = '00000000-0000-0000-0000-0000000000d1';
update profiles set first_name = 'Pirate' where id = '00000000-0000-0000-0000-0000000000d3';
reset role;
insert into memberships (org_id, user_id, role) values (:'org', '00000000-0000-0000-0000-0000000000d3', 'member');
set role authenticated;
do $$ begin
  if (select count(*) from profiles) <> 2 then raise exception 'ne voit pas le nom de son coéquipier'; end if;
end $$;
reset role;
do $$ begin
  if (select first_name from profiles where id = '00000000-0000-0000-0000-0000000000d1') <> 'Awa Marie' then raise exception 'mise à jour de son profil refusée'; end if;
  if (select first_name from profiles where id = '00000000-0000-0000-0000-0000000000d3') <> 'Inès' then raise exception 'profil étranger modifié'; end if;
  if has_function_privilege('anon', 'public.shares_org(uuid)', 'execute') then raise exception 'shares_org accessible sans connexion'; end if;
  raise notice 'Profils: tous les contrôles passent';
end $$;
