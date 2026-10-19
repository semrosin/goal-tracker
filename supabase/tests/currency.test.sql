begin;
select plan(10);

insert into auth.users (id, email) values
  ('30000000-0000-4000-8000-000000000003', 'currency-a@example.test'),
  ('40000000-0000-4000-8000-000000000004', 'currency-b@example.test');
set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000003';

select lives_ok($$select public.create_goal('legacy', 'Legacy', 1000)$$, 'legacy create stays compatible');
select is((select currency from public.goals where id = 'legacy'), 'RUB', 'legacy goals default to rubles');
select lives_ok($$select public.create_goal('usd', 'Trip', 2000, null, '2027-02', 'USD')$$, 'creates a dollar goal');
select is((select goal->>'currency' from jsonb_array_elements(public.get_ledger()->'goals') as goal where goal->>'id' = 'usd'), 'USD', 'ledger snapshot includes currency');
select lives_ok($$select public.update_goal('usd', 'Trip edited', 3000)$$, 'legacy update stays compatible');
select is((select currency from public.goals where id = 'usd'), 'USD', 'omitted currency preserves dollars');
select lives_ok($$select public.update_goal('usd', 'Trip', 3000, null, null, 'RUB')$$, 'owner can change currency');
select throws_ok($$select public.create_goal('eur', 'Invalid', 1000, null, null, 'EUR')$$, '23514', null, 'unsupported currency is rejected');

set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000004';
select throws_ok($$select public.update_goal('usd', 'Not mine', 3000, null, null, 'USD')$$, '42501', null, 'another owner cannot change currency');
select is((select count(*)::integer from public.goals where id = 'usd'), 0, 'currency does not bypass owner-only reads');
select * from finish();
rollback;
