-- Run with `supabase test db` after applying the migrations.
-- Each assertion exercises the real grants, RLS policies, or RPC behavior.
begin;

select plan(47);

insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'ledger-a@example.test'),
  ('20000000-0000-4000-8000-000000000002', 'ledger-b@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select lives_ok(
  $$select public.create_goal('a-goal', '  Trip  ', 1000, '', '2027-02')$$,
  'owner creates a goal through RPC'
);
select results_eq(
  $$select title, target_month from public.goals where id = 'a-goal'$$,
  $$values ('Trip'::text, '2027-02-01'::date)$$,
  'goal title and month are normalized'
);
select lives_ok(
  $$select public.add_transaction('a-deposit-1', 'a-goal', 'deposit', 100)$$,
  'first deposit succeeds'
);
select lives_ok(
  $$select public.add_transaction('a-withdrawal', 'a-goal', 'withdrawal', 80)$$,
  'withdrawal within balance succeeds'
);
select lives_ok(
  $$select public.add_transaction('a-deposit-2', 'a-goal', 'deposit', 100)$$,
  'later deposit succeeds'
);
select results_eq(
  $$select position from public.transactions where goal_id = 'a-goal' order by position$$,
  array[1::bigint, 2::bigint, 3::bigint],
  'transaction order is explicit'
);
select results_eq(
  $$select ledger_version from public.goals where id = 'a-goal'$$,
  array[3::bigint],
  'each accepted ledger mutation updates the parent row'
);
select throws_ok(
  $$select public.add_transaction('too-much', 'a-goal', 'withdrawal', 121)$$,
  '23514', null,
  'withdrawal beyond current balance is rejected'
);
select throws_ok(
  $$select public.delete_transaction('a-deposit-1')$$,
  '23514', null,
  'deleting an older deposit is rejected when an intermediate prefix goes negative'
);
select results_eq(
  $$select count(*) from public.transactions where goal_id = 'a-goal'$$,
  array[3::bigint],
  'rejected deletion leaves history intact'
);
select results_eq(
  $$select ledger_version from public.goals where id = 'a-goal'$$,
  array[3::bigint],
  'rejected operations do not change the parent row version'
);
select throws_ok(
  $$select public.update_goal('a-goal', 'Trip', 1000, '', '2027-13')$$,
  '23514', null,
  'invalid target month is rejected'
);
select lives_ok(
  $$select public.update_goal('a-goal', 'Trip', 1000, '', null)$$,
  'target month can be cleared'
);
select results_eq(
  $$select target_month is null from public.goals where id = 'a-goal'$$,
  array[true],
  'cleared month is stored as null'
);
select lives_ok(
  $$select public.create_goal('limit-goal', 'Limit', 9007199254740991)$$,
  'largest JS safe integer is accepted as target'
);
select lives_ok(
  $$select public.add_transaction('limit-deposit', 'limit-goal', 'deposit', 9007199254740991)$$,
  'largest JS safe integer is accepted as balance'
);
select throws_ok(
  $$select public.add_transaction('limit-overflow', 'limit-goal', 'deposit', 1)$$,
  '22003', null,
  'balance above JS safe integer is rejected'
);
select results_eq(
  $$select array_agg(item->>'id') from jsonb_array_elements(public.get_ledger()->'transactions') as entry(item)$$,
  $$values (array['a-deposit-1', 'a-withdrawal', 'a-deposit-2', 'limit-deposit']::text[])$$,
  'read RPC returns complete transactions in deterministic order'
);

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';

select lives_ok(
  $$select public.create_goal('b-goal', 'Books', 500)$$,
  'second user creates an independent goal'
);
select results_eq(
  $$select id from public.goals order by id$$,
  array['b-goal'::text],
  'RLS hides the first user goals'
);
select results_eq(
  $$select count(*) from public.transactions$$,
  array[0::bigint],
  'RLS hides the first user transactions'
);
select results_eq(
  $$select public.get_ledger()->'goals'->0->>'id'$$,
  array['b-goal'::text],
  'read RPC returns only the current user goal'
);
select results_eq(
  $$select jsonb_array_length(public.get_ledger()->'transactions')$$,
  array[0::integer],
  'read RPC hides the other user transactions'
);
select throws_ok(
  $$select public.update_goal('a-goal', 'Stolen', 1)$$,
  '42501', null,
  'other user cannot update a goal'
);
select throws_ok(
  $$select public.delete_goal('a-goal')$$,
  '42501', null,
  'other user cannot delete a goal'
);
select throws_ok(
  $$select public.add_transaction('stolen-deposit', 'a-goal', 'deposit', 10)$$,
  '42501', null,
  'other user cannot add to a goal'
);
select throws_ok(
  $$select public.delete_transaction('a-deposit-1')$$,
  '42501', null,
  'other user cannot delete a transaction'
);
select throws_ok(
  $$select app_private.update_goal('a-goal', 'Stolen', 1, null, null)$$,
  '42501', null,
  'private update implementation checks ownership independently'
);
select throws_ok(
  $$select app_private.add_transaction('private-stolen', 'a-goal', 'deposit', 10)$$,
  '42501', null,
  'private add implementation checks ownership independently'
);
select throws_ok(
  $$select app_private.delete_transaction('a-deposit-1')$$,
  '42501', null,
  'private delete implementation checks ownership independently'
);
select throws_ok(
  $$select app_private.normalize_target_month('2027-02')$$,
  '42501', null,
  'authenticated callers cannot execute internal helpers'
);
select throws_ok(
  $$insert into public.goals (id, user_id, title, target_amount)
    values ('direct-goal', '20000000-0000-4000-8000-000000000002', 'Direct', 1)$$,
  '42501', null,
  'direct goal writes are forbidden'
);
select throws_ok(
  $$insert into public.transactions (id, user_id, goal_id, type, amount, position)
    values ('direct-tx', '20000000-0000-4000-8000-000000000002', 'b-goal', 'deposit', 1, 1)$$,
  '42501', null,
  'direct transaction writes are forbidden'
);
select lives_ok(
  $$select public.add_transaction('b-deposit', 'b-goal', 'deposit', 50)$$,
  'second user can write to own goal through RPC'
);
select results_eq(
  $$select id from public.transactions$$,
  array['b-deposit'::text],
  'second user sees only own transaction'
);
select results_eq(
  $$select public.get_ledger()->'transactions'->0->>'id'$$,
  array['b-deposit'::text],
  'read RPC returns the current user transaction'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select results_eq(
  $$select id from public.goals order by id$$,
  array['a-goal'::text, 'limit-goal'::text],
  'first user still sees only own goals'
);
select results_eq(
  $$select public.get_ledger()->'transactions' @> '[{"id":"b-deposit"}]'::jsonb$$,
  array[false],
  'read RPC excludes transactions owned by another user'
);
select lives_ok(
  $$select public.delete_transaction('a-withdrawal')$$,
  'deleting a withdrawal succeeds when all remaining prefixes stay valid'
);
select lives_ok(
  $$select public.delete_transaction('a-deposit-1')$$,
  'older deposit can be deleted after dependent withdrawal is removed'
);
select results_eq(
  $$select position from public.transactions where goal_id = 'a-goal'$$,
  array[3::bigint],
  'remaining operation retains its explicit order'
);
select results_eq(
  $$select ledger_version from public.goals where id = 'a-goal'$$,
  array[5::bigint],
  'successful deletions each update the parent row'
);
select lives_ok(
  $$select public.delete_goal('a-goal')$$,
  'owner can delete the goal'
);
select results_eq(
  $$select count(*) from public.transactions where goal_id = 'a-goal'$$,
  array[0::bigint],
  'goal deletion cascades to its transactions'
);

set local role anon;
reset request.jwt.claim.sub;
select throws_ok(
  $$select public.create_goal('anonymous-goal', 'Anonymous', 100)$$,
  '42501', null,
  'anonymous caller cannot execute write RPC'
);
select throws_ok(
  $$select count(*) from public.goals$$,
  '42501', null,
  'anonymous caller cannot read private goals'
);
select throws_ok(
  $$select public.get_ledger()$$,
  '42501', null,
  'anonymous caller cannot execute read RPC'
);

select * from finish();
rollback;
