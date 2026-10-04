# Goal Tracker

[Русская версия](README.ru.md)

A bilingual savings goal tracker built with React and TypeScript. Create an email account to sync goals and transactions through Supabase. All amounts are whole rubles.

## Screenshots

| Welcome                                                 | Goal overview                                           | Savings plan and history                           |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| ![Welcome screen](docs/screenshots/desktop-welcome.png) | ![Goal overview](docs/screenshots/desktop-overview.png) | ![Goal details](docs/screenshots/desktop-goal.png) |

[Mobile welcome](docs/screenshots/mobile-welcome.png) · [Mobile overview](docs/screenshots/mobile-overview.png) · [Mobile goal](docs/screenshots/mobile-goal.png)

## Features

- Multiple goals with deposits, withdrawals, progress, and ordered transaction history.
- An optional target month and required contribution: `ceil(remaining / months including the current and target months)`.
- A what-if calculator forecasts the completion month for a chosen monthly contribution. Completed and overdue goals have distinct states.
- An offline demo with example goals remains for browsers that stored the preference earlier; its data stays in browser storage and is never uploaded automatically.
- Supabase Auth for email/password registration, confirmation, sign-in, and password recovery. Postgres is the source of truth for an account.
- Russian and English UI with a saved language choice.

## Architecture and tradeoffs

The app uses React 19, TypeScript, React Router, Redux Toolkit, CSS Modules, Jest, and Playwright. The same goal and transaction components render both modes. The demo store persists to `goal-tracker-demo-state`; legacy local data in `goal-tracker-state` is copied into the demo on first entry without changing the original. The cloud store never persists its ledger to browser storage. After a mutation, tab focus, or reconnect, it reloads the account's ledger from Postgres.

Cloud tables use owner-only SELECT policies. Direct client writes are revoked; five authenticated RPCs create/update/delete goals and add/delete transactions. A separate `get_ledger()` function reads both tables in one snapshot and returns the complete ledger as one object. Transactions have an explicit `position`, so order does not depend on timestamps. Each balance-changing RPC locks its goal row and validates the ordered history. Updating `ledger_version` makes a competing `REPEATABLE READ` writer fail with a serialization conflict instead of accepting a stale balance. The browser also checks common invalid actions, while the server remains authoritative.

The cloud client reloads a small complete ledger after each change instead of using realtime subscriptions or optimistic writes. This simplifies consistency and error recovery, but very large histories would need pagination. Amounts are integer RUB; fractional currency is out of scope. Local data is deliberately separate from cloud accounts. A paused Supabase Free project affects accounts, while the static demo remains usable.

## Run locally

Node.js 22.11 or newer is required.

```sh
npm ci
npm start
```

Open `http://localhost:3000`. The app boots without environment values; for cloud accounts, copy `.env.example` to `.env`, then set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for a Supabase project with the migration applied. Webpack reads `.env` at startup. These values are public browser configuration; **never use a service-role or secret key here**.

```sh
npm run lint
npm run format:check
npm run typecheck
npm test -- --silent
npm run build
npm run test:e2e
```

Production output is `build/`. `npm run capture:screenshots` refreshes the six screenshots while `npm start` is running. The browser suite covers desktop, mobile, keyboard focus, demo operations, and the sign-in UI. pgTAP and two-session race tests run in CI; locally they require Supabase CLI, Docker, Bash, and `psql`.
