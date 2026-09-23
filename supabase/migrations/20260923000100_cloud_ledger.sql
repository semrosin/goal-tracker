-- The ledger is immutable except through the five authenticated RPCs below.
-- A row lock on the parent goal serializes every operation that can change its history.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table public.goals (
  id text not null check (char_length(id) between 1 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  description text,
  target_amount bigint not null check (target_amount between 1 and 9007199254740991),
  target_month date check (target_month is null or extract(day from target_month) = 1),
  ledger_version bigint not null default 0 check (ledger_version >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.transactions (
  id text not null check (char_length(id) between 1 and 200),
  user_id uuid not null,
  goal_id text not null,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount bigint not null check (amount between 1 and 9007199254740991),
  position bigint not null check (position between 1 and 9007199254740991),
  created_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  unique (user_id, goal_id, position),
  foreign key (user_id, goal_id)
    references public.goals (user_id, id) on delete cascade
);

-- Primary keys cover owner lookups; the unique order key covers history reads.

alter table public.goals enable row level security;
alter table public.transactions enable row level security;

create policy goals_owner_select on public.goals
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy transactions_owner_select on public.transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.goals, public.transactions from public, anon, authenticated;
grant select on public.goals, public.transactions to authenticated;

create function app_private.normalize_target_month(p_month text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_month is null then
    return null;
  end if;

  if p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Target month must be YYYY-MM'
      using errcode = '23514';
  end if;

  if left(p_month, 4)::integer = 0 then
    raise exception 'Target month must be YYYY-MM'
      using errcode = '23514';
  end if;

  return make_date(left(p_month, 4)::integer, right(p_month, 2)::integer, 1);
end;
$$;

create function app_private.create_goal(
  p_id text,
  p_title text,
  p_target_amount bigint,
  p_description text,
  p_target_month text
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_goal public.goals;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.goals (id, user_id, title, description, target_amount, target_month)
  values (
    p_id,
    v_uid,
    btrim(p_title),
    nullif(btrim(p_description), ''),
    p_target_amount,
    app_private.normalize_target_month(p_target_month)
  )
  returning * into v_goal;

  return v_goal;
end;
$$;

create function app_private.update_goal(
  p_id text,
  p_title text,
  p_target_amount bigint,
  p_description text,
  p_target_month text
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_goal public.goals;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.goals
  set title = btrim(p_title),
      target_amount = p_target_amount,
      description = nullif(btrim(p_description), ''),
      target_month = app_private.normalize_target_month(p_target_month)
  where user_id = v_uid and id = p_id
  returning * into v_goal;

  if not found then
    raise exception 'Goal not found' using errcode = '42501';
  end if;

  return v_goal;
end;
$$;

create function app_private.delete_goal(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.goals where user_id = v_uid and id = p_id;

  if not found then
    raise exception 'Goal not found' using errcode = '42501';
  end if;
end;
$$;

create function app_private.add_transaction(
  p_id text,
  p_goal_id text,
  p_type text,
  p_amount bigint
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_position bigint;
  v_balance numeric;
  v_next_balance numeric;
  v_transaction public.transactions;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- This lock is held through the balance check and insertion. It serializes
  -- concurrent withdrawals, deletes, and goal deletion for this one ledger.
  perform 1 from public.goals
  where user_id = v_uid and id = p_goal_id
  for update;

  if not found then
    raise exception 'Goal not found' using errcode = '42501';
  end if;

  if p_type not in ('deposit', 'withdrawal') or p_type is null then
    raise exception 'Invalid transaction type' using errcode = '23514';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 9007199254740991 then
    raise exception 'Invalid amount' using errcode = '23514';
  end if;

  select coalesce(max(position), 0) + 1,
         coalesce(sum(case when type = 'deposit' then amount else -amount end), 0)
  into v_position, v_balance
  from public.transactions
  where user_id = v_uid and goal_id = p_goal_id;

  v_next_balance := v_balance + case when p_type = 'deposit' then p_amount else -p_amount end;

  if v_next_balance < 0 then
    raise exception 'Insufficient balance' using errcode = '23514';
  end if;

  if v_next_balance > 9007199254740991 then
    raise exception 'Balance exceeds safe integer range' using errcode = '22003';
  end if;

  insert into public.transactions (id, user_id, goal_id, type, amount, position)
  values (p_id, v_uid, p_goal_id, p_type, p_amount, v_position)
  returning * into v_transaction;

  -- A real parent-row update makes a concurrent REPEATABLE READ writer fail
  -- with 40001 instead of validating against a stale transaction snapshot.
  update public.goals
  set ledger_version = ledger_version + 1
  where user_id = v_uid and id = p_goal_id;

  return v_transaction;
end;
$$;

create function app_private.delete_transaction(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_goal_id text;
  v_min_balance numeric;
  v_max_balance numeric;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select goal_id into v_goal_id
  from public.transactions
  where user_id = v_uid and id = p_id;

  if not found then
    raise exception 'Transaction not found' using errcode = '42501';
  end if;

  -- Recheck the transaction after acquiring the parent lock: another writer
  -- may have removed it while this call waited.
  perform 1 from public.goals
  where user_id = v_uid and id = v_goal_id
  for update;

  if not found then
    raise exception 'Goal not found' using errcode = '42501';
  end if;

  delete from public.transactions
  where user_id = v_uid and id = p_id and goal_id = v_goal_id;

  if not found then
    raise exception 'Transaction not found' using errcode = '42501';
  end if;

  select min(balance), max(balance)
  into v_min_balance, v_max_balance
  from (
    select sum(case when type = 'deposit' then amount else -amount end)
      over (order by position rows between unbounded preceding and current row) as balance
    from public.transactions
    where user_id = v_uid and goal_id = v_goal_id
  ) as prefixes;

  if v_min_balance < 0 then
    raise exception 'Deleting transaction would make history negative'
      using errcode = '23514';
  end if;

  if v_max_balance > 9007199254740991 then
    raise exception 'Balance exceeds safe integer range' using errcode = '22003';
  end if;

  update public.goals
  set ledger_version = ledger_version + 1
  where user_id = v_uid and id = v_goal_id;
end;
$$;

-- Exposed RPC functions run as the caller; the privileged implementation lives
-- outside the API-exposed public schema and checks auth.uid() itself.
create function public.create_goal(
  p_id text,
  p_title text,
  p_target_amount bigint,
  p_description text default null,
  p_target_month text default null
)
returns public.goals
language sql
security invoker
set search_path = ''
as $$ select app_private.create_goal($1, $2, $3, $4, $5) $$;

create function public.update_goal(
  p_id text,
  p_title text,
  p_target_amount bigint,
  p_description text default null,
  p_target_month text default null
)
returns public.goals
language sql
security invoker
set search_path = ''
as $$ select app_private.update_goal($1, $2, $3, $4, $5) $$;

create function public.delete_goal(p_id text)
returns void
language sql
security invoker
set search_path = ''
as $$ select app_private.delete_goal($1) $$;

create function public.add_transaction(
  p_id text,
  p_goal_id text,
  p_type text,
  p_amount bigint
)
returns public.transactions
language sql
security invoker
set search_path = ''
as $$ select app_private.add_transaction($1, $2, $3, $4) $$;

create function public.delete_transaction(p_id text)
returns void
language sql
security invoker
set search_path = ''
as $$ select app_private.delete_transaction($1) $$;

-- One SQL statement gives both arrays one MVCC snapshot. A scalar JSONB
-- response also avoids PostgREST's default row cap on table SELECT results.
-- The invoker's existing SELECT RLS policies filter both source tables.
create function public.get_ledger()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'goals', coalesce(
      (select jsonb_agg(to_jsonb(g) order by g.created_at, g.id)
       from public.goals as g),
      '[]'::jsonb
    ),
    'transactions', coalesce(
      (select jsonb_agg(to_jsonb(t) order by t.goal_id, t.position)
       from public.transactions as t),
      '[]'::jsonb
    )
  );
$$;

revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.create_goal(text, text, bigint, text, text) to authenticated;
grant execute on function app_private.update_goal(text, text, bigint, text, text) to authenticated;
grant execute on function app_private.delete_goal(text) to authenticated;
grant execute on function app_private.add_transaction(text, text, text, bigint) to authenticated;
grant execute on function app_private.delete_transaction(text) to authenticated;

revoke all on function public.create_goal(text, text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.update_goal(text, text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.delete_goal(text) from public, anon, authenticated;
revoke all on function public.add_transaction(text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.delete_transaction(text) from public, anon, authenticated;
revoke all on function public.get_ledger() from public, anon, authenticated;

grant execute on function public.create_goal(text, text, bigint, text, text) to authenticated;
grant execute on function public.update_goal(text, text, bigint, text, text) to authenticated;
grant execute on function public.delete_goal(text) to authenticated;
grant execute on function public.add_transaction(text, text, text, bigint) to authenticated;
grant execute on function public.delete_transaction(text) to authenticated;
grant execute on function public.get_ledger() to authenticated;
