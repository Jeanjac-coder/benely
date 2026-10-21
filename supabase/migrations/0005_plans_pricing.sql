-- Offres: Business passe à 14 900 FCFA par mois, Starter inclut 2 collaborateurs.
update public.plans set price_monthly = 14900 where id = 'business';
update public.plans set quotas = jsonb_set(quotas, '{members}', '2') where id = 'starter';
