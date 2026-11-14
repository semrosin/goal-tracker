-- Appearance values are intentionally limited to the choices offered by the app.
alter table public.goals
  add column color text not null default 'violet' check (color in ('violet', 'forest', 'ocean', 'amber', 'rose')),
  add column icon text not null default 'target' check (icon in ('target', 'plane', 'home', 'car', 'gift', 'heart', 'laptop', 'graduation'));

drop function public.create_goal(text, text, bigint, text, text, text);
drop function public.update_goal(text, text, bigint, text, text, text);
drop function app_private.create_goal(text, text, bigint, text, text, text);
drop function app_private.update_goal(text, text, bigint, text, text, text);

create function app_private.create_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text, p_target_month text, p_currency text, p_color text, p_icon text
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

  insert into public.goals (id, user_id, title, description, target_amount, target_month, currency, color, icon)
  values (p_id, v_uid, btrim(p_title), nullif(btrim(p_description), ''),
    p_target_amount, app_private.normalize_target_month(p_target_month), p_currency, p_color, p_icon)
  returning * into v_goal;
  return v_goal;
end;
$$;

create function app_private.update_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text, p_target_month text, p_currency text, p_color text, p_icon text
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
      currency = coalesce(p_currency, currency),
      color = coalesce(p_color, color), icon = coalesce(p_icon, icon)
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
  p_currency text default 'RUB', p_color text default 'violet', p_icon text default 'target'
)
returns public.goals
language sql security invoker set search_path = ''
as $$ select app_private.create_goal($1, $2, $3, $4, $5, $6, $7, $8) $$;

create function public.update_goal(
  p_id text, p_title text, p_target_amount bigint,
  p_description text default null, p_target_month text default null,
  p_currency text default null, p_color text default null, p_icon text default null
)
returns public.goals
language sql security invoker set search_path = ''
as $$ select app_private.update_goal($1, $2, $3, $4, $5, $6, $7, $8) $$;

revoke all on function app_private.create_goal(text, text, bigint, text, text, text, text, text) from public, anon, authenticated;
revoke all on function app_private.update_goal(text, text, bigint, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_goal(text, text, bigint, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.update_goal(text, text, bigint, text, text, text, text, text) from public, anon, authenticated;
grant execute on function app_private.create_goal(text, text, bigint, text, text, text, text, text) to authenticated;
grant execute on function app_private.update_goal(text, text, bigint, text, text, text, text, text) to authenticated;
grant execute on function public.create_goal(text, text, bigint, text, text, text, text, text) to authenticated;
grant execute on function public.update_goal(text, text, bigint, text, text, text, text, text) to authenticated;
