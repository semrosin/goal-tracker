# Goal Tracker — project guide

## Product goal

Build a pet project for tracking savings goals. A user can create, edit, and delete goals; record money added to or withdrawn from each goal; and see progress toward every target.

## MVP scope

- Store all data locally in `localStorage`. Do not add a backend, authentication, or cloud sync.
- The interface language is Russian; format all monetary amounts in Russian rubles (`₽`).
- Do not add goal deadlines in the MVP.
- Use two routes:
  - `/` — goals overview and creation of a new goal.
  - `/goals/:id` — a goal detail page with all goal actions and its transaction history.

## Screens and UX

### Goals overview

Show a collection of goal cards. A card contains only:

- goal title;
- a large progress percentage;
- a progress bar;
- a small `накоплено / цель` amount below the bar, formatted in rubles.

Clicking a card opens the goal detail page. Keep all extra information and operations off the overview card.

### Goal detail

The detail page contains:

- goal editing and deletion;
- adding a transaction as either a deposit or a withdrawal;
- a chronological history of transactions;
- deletion of an incorrect transaction;
- the current saved amount and visual progress.

Ask for confirmation before deleting a goal or transaction.

## Domain rules

Use a transaction ledger as the single source of truth for a goal balance. Never persist a mutable `savedAmount` independently of its transactions.

```ts
type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  createdAt: string;
};

type Transaction = {
  id: string;
  goalId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  createdAt: string;
};
```

- `balance = sum(deposits) - sum(withdrawals)` for the goal.
- `progress = min(100, balance / targetAmount * 100)`.
- A title is required.
- Target and transaction amounts must be greater than zero.
- A withdrawal must not exceed the current balance; a balance must never become negative.
- Invalid or unreadable `localStorage` data must fall back safely to an empty state.

## Required stack

- React
- TypeScript
- Redux Toolkit (Redux)
- SCSS
- Feature-Sliced Design (FSD)
- React Router for the two MVP routes

Use **Finlandica Text** as the primary interface font, with a system sans-serif fallback.

## FSD structure

Keep dependency direction from higher layers to lower layers:

```text
src/
  app/        # providers, Redux store, routing, global styles
  pages/      # goals overview and goal detail pages
  widgets/    # composed page blocks, e.g. goals list and goal details
  features/   # create/edit/delete goal; add/delete transaction
  entities/   # goal and transaction models, selectors, UI
  shared/     # reusable UI, utilities, configuration, localStorage adapter
```

Avoid importing from higher FSD layers into lower ones. Keep business calculations in entity selectors or shared utilities, not in page components.

## State, persistence, and testing

- Keep application state in Redux; hydrate it once when the app starts and persist relevant data to `localStorage` after state changes.
- Derive balances and progress through selectors so every screen uses the same calculation.
- Cover reducers and selectors with tests: goal CRUD, deposits, withdrawals, transaction deletion, balance calculation, progress calculation, and protection against negative balance.
- Keep components focused and use SCSS styles scoped to their components where practical.

## Explicitly out of scope for MVP

- Backend/API, accounts, authentication, and synchronization.
- Goal deadlines.
- Multi-currency support.
- Editing individual transactions.
