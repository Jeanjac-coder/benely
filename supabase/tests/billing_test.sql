-- Recette T10 (activation après confirmation) et protections de la facturation.
\set ON_ERROR_STOP on
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to service_role;
grant all on storage.objects to authenticated, service_role;

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@a.ci'),
  ('00000000-0000-0000-0000-0000000000a2', 'membre@a.ci');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
set request.jwt.claim.email = 'owner@a.ci';
select public.create_organization('Facturée') as org \gset
reset role;
insert into memberships (org_id, user_id, role) values (:'org', '00000000-0000-0000-0000-0000000000a2', 'member');
set role authenticated;

do $$ begin
  if (select status from subscriptions) <> 'trialing' then raise exception 'pas d''essai à la création'; end if;
end $$;

insert into payments (org_id, plan_id, transaction_id, amount, currency, provider, created_by)
  values (:'org', 'business', 'TX1', 14900, 'XOF', 'cinetpay', auth.uid());

-- Tentatives interdites au navigateur
\set ON_ERROR_STOP off
select public.confirm_payment('TX1', 'OM', '{}');
insert into payments (org_id, plan_id, transaction_id, amount, currency, status, provider, created_by)
  values (:'org', 'business', 'TX-FRAUDE', 14900, 'XOF', 'accepted', 'cinetpay', auth.uid());
update subscriptions set status = 'active', plan_id = 'enterprise';
update payments set status = 'accepted';
update plans set price_monthly = 1;
insert into storage.objects (bucket_id, name) values ('logos', '00000000-0000-0000-0000-000000000999/logo.png');
\set ON_ERROR_STOP on
insert into storage.objects (bucket_id, name) values ('logos', :'org' || '/logo.png');

do $$ begin
  if (select status from subscriptions) <> 'trialing' then raise exception 'abonnement modifié par le client'; end if;
  if exists (select 1 from payments where status <> 'pending') then raise exception 'paiement validé par le client'; end if;
  if (select price_monthly from plans where id = 'starter') <> 9900 then raise exception 'offre modifiée par le client'; end if;
end $$;

-- Un collaborateur ne voit ni paiements ni factures
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
do $$ begin
  if exists (select 1 from payments) then raise exception 'un collaborateur voit les paiements'; end if;
  if (select count(*) from subscriptions) <> 1 then raise exception 'le collaborateur ne voit pas l''abonnement'; end if;
end $$;
\set ON_ERROR_STOP off
select public.set_cancel_at_period_end(:'org', true);
\set ON_ERROR_STOP on

-- Confirmation par le serveur (rôle service)
reset role;
set role service_role;
select public.confirm_payment('TX1', 'OM', '{"status": "ACCEPTED"}');
select public.confirm_payment('TX1', 'OM', '{"status": "ACCEPTED"}') as second \gset
do $$ begin
  if (select status from subscriptions) <> 'active' or (select plan_id from subscriptions) <> 'business' then raise exception 'activation absente'; end if;
  if (select count(*) from invoices) <> 1 then raise exception 'facture absente ou en double'; end if;
  if (select number from invoices) !~ '^BEN-\d{4}-\d{6}$' then raise exception 'numéro de facture invalide'; end if;
end $$;
select :'second' = 'already_accepted' as idempotent \gset
\if :idempotent
\else
  do $$ begin raise exception 'confirmation non idempotente'; end $$;
\endif

-- Renouvellement anticipé: la période est prolongée à partir de l'échéance
insert into payments (org_id, plan_id, transaction_id, amount, currency, provider, created_by)
  values (:'org', 'business', 'TX2', 14900, 'XOF', 'cinetpay', '00000000-0000-0000-0000-0000000000a1');
select current_period_end as end1 from subscriptions \gset
select public.confirm_payment('TX2', 'WAVE', '{}');
do $$ begin
  if (select current_period_end from subscriptions) <= now() + interval '45 days' then raise exception 'renouvellement non cumulé'; end if;
end $$;

-- Échec de paiement
insert into payments (org_id, plan_id, transaction_id, amount, currency, provider, created_by)
  values (:'org', 'starter', 'TX3', 9900, 'XOF', 'cinetpay', '00000000-0000-0000-0000-0000000000a1');
select public.fail_payment('TX3', 'refused', 'Solde insuffisant', '{}');
do $$ begin
  if (select status from payments where transaction_id = 'TX3') <> 'refused' then raise exception 'échec non enregistré'; end if;
  if (select plan_id from subscriptions) <> 'business' then raise exception 'un échec a changé l''offre'; end if;
end $$;

-- Expiration
update subscriptions set current_period_end = now() - interval '1 day';
select public.refresh_subscription_statuses();
do $$ begin if (select status from subscriptions) <> 'past_due' then raise exception 'pas de retard de paiement'; end if; end $$;
update subscriptions set current_period_end = now() - interval '5 days';
select public.refresh_subscription_statuses();
do $$ begin
  if (select status from subscriptions) <> 'expired' then raise exception 'pas d''expiration après le délai de grâce'; end if;
  if (select count(*) from storage.objects) <> 1 then raise exception 'logo hors de son dossier accepté'; end if;
  raise notice 'Facturation: tous les contrôles passent';
end $$;
