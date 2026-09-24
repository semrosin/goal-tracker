#!/usr/bin/env bash
# Requires psql and DATABASE_URL for a disposable local Supabase database.
# Run separately from `supabase test db`; this uses two real DB sessions.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the local Supabase Postgres URL}"
command -v psql >/dev/null

test_user="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c 'select gen_random_uuid()')"
temporary_files=()

cleanup() {
  psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 \
    -c "delete from auth.users where id = '${test_user}'::uuid" >/dev/null 2>&1 || true
  rm -f "${temporary_files[@]}"
}
trap cleanup EXIT

psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 \
  -c "insert into auth.users (id, email) values ('${test_user}', 'race-${test_user}@example.test')"

run_race() {
  local tag="$1"
  local isolation="$2"
  local expected_error="$3"
  local goal_id="race-${tag}-${test_user}"
  local first_sql first_log second_log first_pid second_pid ready blocked active result

  first_sql="$(mktemp)"
  first_log="$(mktemp)"
  second_log="$(mktemp)"
  temporary_files+=("$first_sql" "$first_log" "$second_log")

  psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${test_user}';
select public.create_goal('${goal_id}', 'Race test', 100);
select public.add_transaction('seed-${tag}-${test_user}', '${goal_id}', 'deposit', 100);
SQL

  cat > "$first_sql" <<SQL
begin isolation level ${isolation};
set local role authenticated;
set local request.jwt.claim.sub = '${test_user}';
select public.add_transaction('first-${tag}-${test_user}', '${goal_id}', 'withdrawal', 80);
select pg_sleep(8);
commit;
SQL

  PGAPPNAME="ledger_race_first_${tag}" psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 \
    -f "$first_sql" >"$first_log" 2>&1 &
  first_pid=$!

  # The first writer has inserted and updated the goal but has not committed.
  ready=false
  for _ in $(seq 1 100); do
    active="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c \
      "select count(*) from pg_stat_activity where application_name = 'ledger_race_first_${tag}' and state = 'active' and query like '%pg_sleep(8)%'")"
    if [[ "$active" == 1 ]]; then
      ready=true
      break
    fi
    if ! kill -0 "$first_pid" 2>/dev/null; then
      cat "$first_log" >&2
      echo "First ${isolation} withdrawal failed before the second session started" >&2
      exit 1
    fi
    sleep 0.05
  done

  if [[ "$ready" != true ]]; then
    echo "Timed out waiting for first ${isolation} session" >&2
    exit 1
  fi

  # The SELECT establishes the second session's snapshot before the first
  # transaction commits. In REPEATABLE READ it must abort with SQLSTATE 40001.
  PGAPPNAME="ledger_race_second_${tag}" psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 >"$second_log" 2>&1 <<SQL &
\set VERBOSITY verbose
begin isolation level ${isolation};
set local role authenticated;
set local request.jwt.claim.sub = '${test_user}';
select count(*) from public.goals where id = '${goal_id}';
select public.add_transaction('second-${tag}-${test_user}', '${goal_id}', 'withdrawal', 80);
commit;
SQL
  second_pid=$!

  # Assert actual lock contention before accepting either SQL error as evidence.
  blocked=false
  for _ in $(seq 1 100); do
    active="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c \
      "select count(*) from pg_stat_activity waiter join pg_stat_activity blocker on blocker.application_name = 'ledger_race_first_${tag}' where waiter.application_name = 'ledger_race_second_${tag}' and waiter.wait_event_type = 'Lock' and blocker.pid = any(pg_blocking_pids(waiter.pid))")"
    if [[ "$active" == 1 ]]; then
      blocked=true
      break
    fi
    if ! kill -0 "$second_pid" 2>/dev/null; then
      cat "$second_log" >&2
      echo "Second ${isolation} session exited before blocking on the first" >&2
      exit 1
    fi
    sleep 0.05
  done

  if [[ "$blocked" != true ]]; then
    cat "$second_log" >&2
    echo "Second ${isolation} session was never observed waiting for the first" >&2
    exit 1
  fi

  if wait "$second_pid"; then
    echo "Both ${isolation} withdrawals succeeded; expected the second to fail" >&2
    exit 1
  fi

  wait "$first_pid"
  if ! grep -q "$expected_error" "$second_log"; then
    cat "$second_log" >&2
    echo "Second ${isolation} session failed for an unexpected reason" >&2
    exit 1
  fi

  result="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c \
    "select count(*) filter (where type = 'withdrawal'), sum(case when type = 'deposit' then amount else -amount end) from public.transactions where user_id = '${test_user}'::uuid and goal_id = '${goal_id}'")"

  if [[ "$result" != '1|20' ]]; then
    echo "Unexpected ${isolation} ledger after concurrent withdrawals: ${result}" >&2
    exit 1
  fi

  echo "${isolation}: one withdrawal accepted, one rejected, balance 20."
}

run_race read_committed 'read committed' 'Insufficient balance'
run_race repeatable_read 'repeatable read' '40001'
