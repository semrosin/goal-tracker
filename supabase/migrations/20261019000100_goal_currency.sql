-- Existing goals remain ruble-denominated. Transactions inherit their goal's
-- currency, so balances and ledger ordering keep their existing semantics.
alter table public.goals
  add column currency text not null default 'RUB'
  check (currency in ('RUB', 'USD'));

drop function public.create_goal(text, text, bigint, text, text);
drop function public.update_goal(text, text, bigint, text, text);
drop function app_private.create_goal(text, text, bigint, text, text);
drop function app_private.update_goal(text, text, bigint, text, text);

create function app_private.create_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text, p_target_month text, p_currency text
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

  insert into public.goals (id, user_id, title, description, target_amount, target_month, currency)
  values (p_id, v_uid, btrim(p_title), nullif(btrim(p_description), ''),
    p_target_amount, app_private.normalize_target_month(p_target_month), p_currency)
  returning * into v_goal;
  return v_goal;
end;
$$;

create function app_private.update_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text, p_target_month text, p_currency text
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
  set title = btrim(p_title), target_amount = p_target_amount,
      description = nullif(btrim(p_description), ''),
      target_month = app_private.normalize_target_month(p_target_month),
      currency = coalesce(p_currency, currency)
  where user_id = v_uid and id = p_id
  returning * into v_goal;
  if not found then
    raise exception 'Goal not found' using errcode = '42501';
  end if;
  return v_goal;
end;
$$;

-- Defaults keep older clients compatible, including updates to dollar goals.
create function public.create_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text default null, p_target_month text default null,
  p_currency text default 'RUB'
)
returns public.goals
language sql security invoker set search_path = ''
as $$ select app_private.create_goal($1, $2, $3, $4, $5, $6) $$;

create function public.update_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text default null, p_target_month text default null,
  p_currency text default null
)
returns public.goals
language sql security invoker set search_path = ''
as $$ select app_private.update_goal($1, $2, $3, $4, $5, $6) $$;

revoke all on function app_private.create_goal(text, text, bigint, text, text, text) from public, anon, authenticated;
revoke all on function app_private.update_goal(text, text, bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.create_goal(text, text, bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.update_goal(text, text, bigint, text, text, text) from public, anon, authenticated;
grant execute on function app_private.create_goal(text, text, bigint, text, text, text) to authenticated;
grant execute on function app_private.update_goal(text, text, bigint, text, text, text) to authenticated;
grant execute on function public.create_goal(text, text, bigint, text, text, text) to authenticated;
grant execute on function public.update_goal(text, text, bigint, text, text, text) to authenticated;
