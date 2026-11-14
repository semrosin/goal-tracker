begin;
select plan(11);
insert into auth.users (id, email) values
 ('50000000-0000-4000-8000-000000000005', 'appearance-a@example.test'),
 ('60000000-0000-4000-8000-000000000006', 'appearance-b@example.test');
set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-000000000005';
select lives_ok($$select public.create_goal('legacy-look', 'Legacy', 1000)$$, 'legacy create remains compatible');
select is((select color from public.goals where id = 'legacy-look'), 'violet', 'legacy color defaults');
select is((select icon from public.goals where id = 'legacy-look'), 'target', 'legacy icon defaults');
select lives_ok($$select public.create_goal('styled', 'Trip', 1000, null, null, 'USD', 'forest', 'plane')$$, 'creates selected appearance');
select is((select goal->>'color' from jsonb_array_elements(public.get_ledger()->'goals') goal where goal->>'id' = 'styled'), 'forest', 'snapshot includes color');
select lives_ok($$select public.update_goal('styled', 'Trip', 1000)$$, 'legacy update remains compatible');
select is((select icon from public.goals where id = 'styled'), 'plane', 'legacy update preserves icon');
select lives_ok($$select public.update_goal('styled', 'Trip', 1000, null, null, null, 'rose', 'home')$$, 'owner updates appearance');
select throws_ok($$select public.create_goal('bad-color', 'Bad', 1000, null, null, 'RUB', 'invalid', 'target')$$, '23514', null, 'invalid color rejected');
select throws_ok($$select public.update_goal('styled', 'Trip', 1000, null, null, null, 'rose', 'invalid')$$, '23514', null, 'invalid icon rejected');
set local request.jwt.claim.sub = '60000000-0000-4000-8000-000000000006';
select throws_ok($$select public.update_goal('styled', 'Other', 1000, null, null, null, 'rose', 'home')$$, '42501', null, 'another owner cannot change appearance');
select * from finish();
rollback;
