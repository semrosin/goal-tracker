# Goal Tracker MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete local, Russian-language, responsive Goal Tracker MVP described in the approved design.

**Architecture:** A Redux Toolkit store owns two plain entity arrays, `goals` and `transactions`; a root reducer enforces cross-entity ledger rules, while entity selectors derive all balances and progress. React Router supplies the overview and detail routes, and a typed persistence module hydrates and saves only serializable domain data in `localStorage`.

**Tech Stack:** React 19, TypeScript, Redux Toolkit, React Redux, React Router DOM, SCSS, Create React App/Jest.

**Spec:** `docs/superpowers/specs/2026-08-29-goal-tracker-mvp-design.md`

## Global Constraints

- Persist only local domain data in `localStorage`; do not add a backend, authentication, cloud sync, deadlines, currencies, or transaction editing.
- Keep all copy Russian and format money as Russian rubles (`₽`); amounts are positive whole rubles.
- New goals start at `0 ₽`; transactions are the sole source of truth for every balance.
- Implement exactly two application routes: `/` and `/goals/:id`.
- Maintain FSD dependency direction: `app → pages → widgets → features → entities → shared`.
- Do not store `savedAmount`; derive `balance` and clamped `progress` through selectors.
- Confirm deletion of a goal or transaction and never permit a negative balance.
- Test reducers/selectors, malformed-storage fallback, lint, and production build before handoff.

---

## Target File Structure

```text
src/
  app/
    App.tsx
    test/renderWithStore.tsx
    providers/AppProviders.tsx
    router/AppRouter.tsx
    store/hooks.ts
    store/persistence.ts
    store/rootReducer.ts
    store/store.ts
    styles/global.scss
  pages/
    goals-overview/ui/GoalsOverviewPage.tsx
    goal-detail/ui/GoalDetailPage.tsx
  widgets/
    goals-list/ui/GoalsList.tsx
    goal-details/ui/GoalSummary.tsx
    goal-details/ui/TransactionsHistory.tsx
  features/
    create-goal/ui/CreateGoalDialog.tsx
    edit-goal/ui/EditGoalDialog.tsx
    delete-goal/ui/DeleteGoalButton.tsx
    add-transaction/ui/TransactionForm.tsx
    delete-transaction/ui/DeleteTransactionButton.tsx
  entities/
    goal/model/types.ts
    goal/model/goalSlice.ts
    goal/model/selectors.ts
    goal/model/goalSlice.test.ts
    transaction/model/types.ts
    transaction/model/transactionSlice.ts
    transaction/model/selectors.ts
    transaction/model/transactionSlice.test.ts
  shared/
    lib/date.ts
    lib/id.ts
    lib/money.ts
    lib/validation.ts
    lib/storage/safeStorage.ts
    ui/Button/Button.tsx
    ui/Dialog/Dialog.tsx
    ui/Field/Field.tsx
    ui/ProgressBar/ProgressBar.tsx
```

Each component owns a colocated `.module.scss` file when it needs non-global styling. Existing `src/index.js`, `src/App.tsx`, `src/App.css`, and `src/index.css` are replaced by the FSD entry point and global SCSS.

## Domain Interfaces

```ts
export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  createdAt: string;
};

export type TransactionType = 'deposit' | 'withdrawal';

export type Transaction = {
  id: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
};

export type RootState = {
  goals: Goal[];
  transactions: Transaction[];
};
```

```ts
export const calculateBalance = (
  goalId: string,
  transactions: Transaction[]
): number =>
  transactions
    .filter((transaction) => transaction.goalId === goalId)
    .reduce(
      (total, transaction) =>
        total +
        (transaction.type === 'deposit'
          ? transaction.amount
          : -transaction.amount),
      0
    );

export const calculateProgress = (
  balance: number,
  targetAmount: number
): number => Math.max(0, Math.min(100, (balance / targetAmount) * 100));
```

## Task 1: Bootstrap dependencies, typed application shell, and safe storage

**Files:**

- Modify: `package.json`, `package-lock.json`, `tsconfig.json`, `public/index.html`
- Delete: `src/index.js`, `src/App.tsx`, `src/App.css`, `src/index.css`
- Create: `src/index.tsx`, `src/setupTests.ts`, `src/app/App.tsx`, `src/app/providers/AppProviders.tsx`, `src/app/styles/global.scss`, `src/shared/lib/storage/safeStorage.ts`, `src/shared/lib/storage/safeStorage.test.ts`

**Interfaces:**

- Produces `readJson<T>(key, isValid): T | null` and `writeJson<T>(key, value): boolean`.
- Creates the React/SCSS/TypeScript entry point consumed by every later task.

- [ ] **Step 1: Add required runtime dependencies**

Run:

```bash
npm install @reduxjs/toolkit react-redux react-router-dom
```

Keep existing React, Sass, test, lint, and TypeScript dependencies. Do not add a UI component library, persistence library, icon pack, or date library.

- [ ] **Step 2: Write failing generic safe-storage tests**

Create `src/shared/lib/storage/safeStorage.test.ts` with tests for missing data, malformed JSON, invalid values, and serialisation:

```ts
it('returns null for malformed JSON', () => {
  localStorage.setItem('goal-tracker-state', '{not-json');
  expect(
    readJson(
      'goal-tracker-state',
      (value): value is { version: number } =>
        typeof value === 'object' && value !== null
    )
  ).toBeNull();
});

it('writes serializable data and reports success', () => {
  expect(writeJson('goal-tracker-state', { version: 1 })).toBe(true);
  expect(localStorage.getItem('goal-tracker-state')).toBe('{"version":1}');
});
```

- [ ] **Step 3: Run the focused test and verify failure**

Run:

```bash
npm test -- --watchAll=false --runInBand src/shared/lib/storage/safeStorage.test.ts
```

Expected: the test fails because `readJson`, `writeJson`, and their module do not exist.

- [ ] **Step 4: Implement generic safe storage**

Implement `safeStorage.ts` so both `getItem`/`setItem` and JSON parsing are wrapped in `try/catch`. Its public API is:

```ts
export const readJson = <T>(
  key: string,
  isValid: (value: unknown) => value is T
): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
};

export const writeJson = <T>(key: string, value: T): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
```

- [ ] **Step 5: Add the typed entry shell**

Replace the CRA JavaScript entry with `src/index.tsx`, render `<AppProviders><App /></AppProviders>` under `React.StrictMode`, and import `app/styles/global.scss`. Set `<html lang="ru">` and the title `Goal Tracker` in `public/index.html`. Add Manrope through a stylesheet import and a system `sans-serif` fallback in global SCSS.

Create `src/setupTests.ts` containing `import '@testing-library/jest-dom';`. `AppProviders` is intentionally minimal at this stage and returns `children`; Task 2 adds Redux and Task 3 adds routing.

- [ ] **Step 6: Run safe-storage tests and TypeScript-aware production build**

Run:

```bash
npm test -- --watchAll=false --runInBand src/shared/lib/storage/safeStorage.test.ts
npm run build
```

Expected: safe-storage tests pass; build may not yet have routes but completes without TypeScript errors.

- [ ] **Step 7: Commit the bootstrap task**

```bash
git add package.json package-lock.json tsconfig.json public/index.html src
git commit -m "chore: bootstrap typed goal tracker app"
```

## Task 2: Implement domain slices, root ledger guard, and selectors

**Files:**

- Create: `src/entities/goal/model/types.ts`, `src/entities/goal/model/goalSlice.ts`, `src/entities/goal/model/selectors.ts`, `src/entities/goal/model/goalSlice.test.ts`
- Create: `src/entities/transaction/model/types.ts`, `src/entities/transaction/model/transactionSlice.ts`, `src/entities/transaction/model/selectors.ts`, `src/entities/transaction/model/transactionSlice.test.ts`
- Create: `src/shared/lib/validation.ts`, `src/shared/lib/id.ts`, `src/shared/lib/date.ts`
- Create: `src/app/store/rootReducer.ts`, `src/app/store/store.ts`, `src/app/store/hooks.ts`, `src/app/store/persistence.ts`, `src/app/store/persistence.test.ts`
- Modify: `src/app/providers/AppProviders.tsx`

**Interfaces:**

- Consumes: `readJson`, `writeJson`, and the typed application shell from Task 1.
- Produces: `goalsActions`, `transactionsActions`, `rootReducer`, `createAppStore`, `store`, `useAppDispatch`, `useAppSelector`, `loadPersistedState`, `savePersistedState`, and all balance/progress selectors.

The root module exports the reusable initial value and type needed by tests and the configured store:

```ts
export type RootState = {
  goals: Goal[];
  transactions: Transaction[];
};

export const rootInitialState: RootState = { goals: [], transactions: [] };
```

- [ ] **Step 1: Write failing domain and selector tests**

Create focused tests that make the desired invariants executable:

```ts
const goal: Goal = {
  id: 'g1',
  title: 'Отпуск',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const deposit = (amount: number): Transaction => ({
  id: `deposit-${amount}`,
  goalId: 'g1',
  type: 'deposit',
  amount,
  createdAt: '2026-01-02T00:00:00.000Z',
});

const withdrawal = (amount: number): Transaction => ({
  id: `withdrawal-${amount}`,
  goalId: 'g1',
  type: 'withdrawal',
  amount,
  createdAt: '2026-01-03T00:00:00.000Z',
});

it('derives a balance from the transaction ledger', () => {
  expect(calculateBalance('g1', [deposit(800), withdrawal(300)])).toBe(500);
});

it('clamps progress at 100 percent', () => {
  expect(calculateProgress(1_500, 1_000)).toBe(100);
});

it('does not add a withdrawal larger than the current balance', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(500)] };
  const next = rootReducer(
    state,
    transactionsActions.transactionCreated(withdrawal(600))
  );
  expect(next.transactions).toHaveLength(1);
});

it('removes a goal and all of its transactions', () => {
  const next = rootReducer(
    { goals: [goal], transactions: [deposit(100)] },
    goalsActions.goalRemoved('g1')
  );
  expect(next.goals).toEqual([]);
  expect(next.transactions).toEqual([]);
});

it('falls back to empty state when persisted transaction data is invalid', () => {
  localStorage.setItem(
    'goal-tracker-state',
    JSON.stringify({ goals: [], transactions: [{ amount: 1.5 }] })
  );
  expect(loadPersistedState()).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused domain tests and verify failure**

Run:

```bash
npm test -- --watchAll=false --runInBand src/entities/goal/model/goalSlice.test.ts src/entities/transaction/model/transactionSlice.test.ts src/app/store/persistence.test.ts
```

Expected: tests fail because slices, selectors, root reducer, and domain persistence do not exist.

- [ ] **Step 3: Implement domain types, pure utilities, and entity reducers**

Implement:

```ts
export const isPositiveInteger = (value: number): boolean =>
  Number.isFinite(value) && Number.isInteger(value) && value > 0;

export const calculateBalance = (goalId: string, transactions: Transaction[]) =>
  transactions
    .filter((transaction) => transaction.goalId === goalId)
    .reduce(
      (total, transaction) =>
        total +
        (transaction.type === 'deposit'
          ? transaction.amount
          : -transaction.amount),
      0
    );

export const calculateProgress = (balance: number, targetAmount: number) =>
  Math.max(0, Math.min(100, (balance / targetAmount) * 100));
```

`goalSlice` accepts `goalCreated`, `goalUpdated`, and `goalRemoved`. `transactionSlice` accepts `transactionCreated`, `transactionRemoved`, and `transactionsRemovedForGoal`. Generate IDs with a local `createId(prefix)` helper and dates with `new Date().toISOString()` in feature code, not inside selectors.

The helpers have these exact implementations:

```ts
export const createTimestamp = (): string => new Date().toISOString();

export const createId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
```

- [ ] **Step 4: Implement domain persistence, the cross-entity root reducer, and configured store**

Keep root state exactly `{ goals, transactions }`. Before forwarding `transactionCreated` to `transactionSlice`, reject the action when its goal does not exist, the amount is not positive integer, or a withdrawal exceeds `calculateBalance(goalId, state.transactions)`. When handling `goalRemoved`, reduce the goal removal and then reduce `transactionsRemovedForGoal(goalId)` in the transaction branch. Its guard uses this concrete shape:

```ts
if (transactionsActions.transactionCreated.match(action)) {
  const transaction = action.payload;
  const goalExists = state.goals.some((goal) => goal.id === transaction.goalId);
  const balance = calculateBalance(transaction.goalId, state.transactions);
  if (!goalExists || !isPositiveInteger(transaction.amount)) return state;
  if (transaction.type === 'withdrawal' && transaction.amount > balance)
    return state;
}
```

In `persistence.ts`, use `readJson` and validate every goal and transaction fully: string `id`, non-empty string `title` where relevant, ISO-string `createdAt`, positive integer amounts, and a valid transaction type. Return `undefined` instead of a partial snapshot when any entry is invalid. Create `createAppStore(preloadedState?: RootState)` with `preloadedState: preloadedState ?? loadPersistedState()` and subscribe once to call `savePersistedState(store.getState())`. Export these types and hooks:

```ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

Update `AppProviders` to mount `<Provider store={store}>`.

- [ ] **Step 5: Run all domain and persistence tests**

Run:

```bash
npm test -- --watchAll=false --runInBand src/entities/goal/model/goalSlice.test.ts src/entities/transaction/model/transactionSlice.test.ts src/app/store/persistence.test.ts
```

Expected: all ledger, cascade, selector, amount-validation, and malformed-storage cases pass.

- [ ] **Step 6: Commit the tested domain layer**

```bash
git add src/app src/entities src/shared/lib
git commit -m "feat: add goal and transaction domain state"
```

## Task 3: Add routing, reusable controls, and page-level states

**Files:**

- Create: `src/app/router/AppRouter.tsx`
- Create: `src/app/test/renderWithStore.tsx`
- Create: `src/shared/lib/money.ts`
- Create: `src/shared/lib/money.test.ts`
- Create: `src/shared/ui/Button/Button.tsx`, `src/shared/ui/Button/Button.module.scss`
- Create: `src/shared/ui/Dialog/Dialog.tsx`, `src/shared/ui/Dialog/Dialog.module.scss`
- Create: `src/shared/ui/Field/Field.tsx`, `src/shared/ui/Field/Field.module.scss`
- Create: `src/shared/ui/ProgressBar/ProgressBar.tsx`, `src/shared/ui/ProgressBar/ProgressBar.module.scss`
- Create: `src/shared/ui/ProgressBar/ProgressBar.test.tsx`
- Create: `src/pages/goals-overview/ui/GoalsOverviewPage.tsx`, `src/pages/goal-detail/ui/GoalDetailPage.tsx`
- Modify: `src/app/App.tsx`, `src/app/providers/AppProviders.tsx`

**Interfaces:**

- Consumes: typed Redux hooks and entity selectors from Task 2.
- Produces: a provider-wrapped two-route shell and shared accessible controls for feature and widget tasks.

The test helper must make later feature tests independent of the production browser router:

```tsx
export const renderWithStore = (
  ui: React.ReactElement,
  preloadedState: RootState = rootInitialState
) => {
  const store = createAppStore(preloadedState);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
  };
};
```

- [ ] **Step 1: Write failing unit tests for money formatting and progress rendering**

Create tests asserting that `formatRubles(123456)` is a Russian-ruble value and that `ProgressBar` renders its accessible percentage:

```tsx
expect(formatRubles(123456)).toContain('₽');
expect(formatRubles(123456)).toMatch(/123(?:\u00a0|\s)456/);
render(<ProgressBar value={42.5} />);
expect(screen.getByRole('progressbar')).toHaveAttribute(
  'aria-valuenow',
  '42.5'
);
```

- [ ] **Step 2: Run the focused UI utility tests and verify failure**

Run:

```bash
npm test -- --watchAll=false --runInBand src/shared/lib/money.test.ts src/shared/ui/ProgressBar/ProgressBar.test.tsx
```

Expected: failure because the formatter and component are not implemented.

- [ ] **Step 3: Implement shared UI and formatting primitives**

`formatRubles` must use `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })`. `Field` renders a label, native input, and an error element connected through `aria-describedby`. `Dialog` traps no focus manually, but uses `role="dialog"`, `aria-modal="true"`, labelled content, Escape close, backdrop close, and a close button. `ProgressBar` exposes `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and a clamped value.

- [ ] **Step 4: Implement the route shell and safe page states**

Set up:

```tsx
<Routes>
  <Route path="/" element={<GoalsOverviewPage />} />
  <Route path="/goals/:id" element={<GoalDetailPage />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Mount `BrowserRouter` in `AppProviders`. The overview page initially renders its title and a create-target slot; the detail page resolves the `id` with selectors and renders `Цель не найдена` plus a link to `/` when absent.

- [ ] **Step 5: Run shared-control tests and a production build**

Run:

```bash
npm test -- --watchAll=false --runInBand src/shared/lib/money.test.ts src/shared/ui/ProgressBar/ProgressBar.test.tsx
npm run build
```

Expected: shared tests pass and both routes compile.

- [ ] **Step 6: Commit routing and shared controls**

```bash
git add src/app src/pages src/shared
git commit -m "feat: add application routing and shared controls"
```

## Task 4: Build the overview and goal-management features

**Files:**

- Create: `src/widgets/goals-list/ui/GoalsList.tsx`, `src/widgets/goals-list/ui/GoalsList.module.scss`
- Create: `src/features/create-goal/ui/CreateGoalDialog.tsx`, `src/features/create-goal/ui/CreateGoalDialog.module.scss`
- Create: `src/features/edit-goal/ui/EditGoalDialog.tsx`, `src/features/edit-goal/ui/EditGoalDialog.module.scss`
- Create: `src/features/delete-goal/ui/DeleteGoalButton.tsx`
- Modify: `src/pages/goals-overview/ui/GoalsOverviewPage.tsx`, `src/pages/goal-detail/ui/GoalDetailPage.tsx`
- Test: `src/features/create-goal/ui/CreateGoalDialog.test.tsx`, `src/widgets/goals-list/ui/GoalsList.test.tsx`

**Interfaces:**

- Consumes: `goalsActions`, `calculateBalance`, `calculateProgress`, typed hooks, `Dialog`, `Field`, `Button`, `ProgressBar`.
- Produces: goal creation/edit/delete UI and minimal navigable overview cards.

- [ ] **Step 1: Write failing goal-feature tests**

Cover the key product decisions:

```tsx
it('creates a new goal with no transaction', async () => {
  const { store } = renderWithStore(
    <CreateGoalDialog isOpen onClose={jest.fn()} />
  );
  await userEvent.type(screen.getByLabelText('Название'), 'Отпуск');
  await userEvent.type(screen.getByLabelText('Целевая сумма'), '100000');
  await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
  expect(store.getState().goals).toHaveLength(1);
  expect(store.getState().transactions).toEqual([]);
});

it('keeps operation controls off an overview card', () => {
  renderWithStore(<GoalsList />);
  expect(
    screen.queryByRole('button', { name: /удалить/i })
  ).not.toBeInTheDocument();
});
```

Import `userEvent` from `@testing-library/user-event` and use Jest's built-in `jest.fn`; do not introduce Vitest.

- [ ] **Step 2: Run overview and creation tests and verify failure**

Run:

```bash
npm test -- --watchAll=false --runInBand src/features/create-goal/ui/CreateGoalDialog.test.tsx src/widgets/goals-list/ui/GoalsList.test.tsx
```

Expected: failure because feature and widget components do not exist.

- [ ] **Step 3: Implement the creation and overview flows**

`CreateGoalDialog` owns `title` and `targetAmount` strings, converts the amount with `Number`, validates `title.trim()` and `isPositiveInteger`, and dispatches:

```ts
goalsActions.goalCreated({
  id: createId('goal'),
  title: title.trim(),
  targetAmount: Number(targetAmount),
  createdAt: createTimestamp(),
});
```

It must not create a transaction. Close and reset only after a successful dispatch. `GoalsList` maps goals to `<Link to={`/goals/${goal.id}`}>` cards with only title, formatted `progress.toFixed(0)%`, `ProgressBar`, and formatted `balance / targetAmount`. The overview owns the dialog open state and shows the specified empty state.

- [ ] **Step 4: Implement edit and confirmed deletion**

`EditGoalDialog` reuses title/target validation and dispatches `goalsActions.goalUpdated({ id, title, targetAmount })`. `DeleteGoalButton` opens a confirmation `Dialog`; confirm dispatches `goalsActions.goalRemoved(id)`, which invokes Task 2's root-reducer cascade. After confirmation on the detail page, navigate to `/`.

- [ ] **Step 5: Add responsive overview styling**

Use a grid with `repeat(auto-fit, minmax(240px, 1fr))`, no fixed card width, a single-column layout below a mobile breakpoint, and full-width primary actions on narrow screens. Do not put supplementary metadata or mutation buttons on cards.

- [ ] **Step 6: Run feature tests, lint, and build**

Run:

```bash
npm test -- --watchAll=false --runInBand src/features/create-goal/ui/CreateGoalDialog.test.tsx src/widgets/goals-list/ui/GoalsList.test.tsx
npm run lint
npm run build
```

Expected: creation, empty state, card content, edit/delete behavior compile and tests pass.

- [ ] **Step 7: Commit the overview feature**

```bash
git add src/features src/widgets src/pages
git commit -m "feat: add goal overview and management"
```

## Task 5: Build the goal detail, transaction form, and ledger history

**Files:**

- Create: `src/widgets/goal-details/ui/GoalSummary.tsx`, `src/widgets/goal-details/ui/GoalSummary.module.scss`
- Create: `src/widgets/goal-details/ui/TransactionsHistory.tsx`, `src/widgets/goal-details/ui/TransactionsHistory.module.scss`
- Create: `src/features/add-transaction/ui/TransactionForm.tsx`, `src/features/add-transaction/ui/TransactionForm.module.scss`
- Create: `src/features/delete-transaction/ui/DeleteTransactionButton.tsx`
- Modify: `src/pages/goal-detail/ui/GoalDetailPage.tsx`
- Test: `src/features/add-transaction/ui/TransactionForm.test.tsx`, `src/widgets/goal-details/ui/TransactionsHistory.test.tsx`

**Interfaces:**

- Consumes: goal/transaction actions, selectors, `formatRubles`, `formatDate`, reusable controls, and typed hooks.
- Produces: the detail flow for current balance, progress, valid transaction creation, chronological history, and confirmed transaction deletion.

- [ ] **Step 1: Write failing transaction-flow tests**

Create tests for valid deposits, blocked overspending, and reverse chronological history:

```tsx
it('shows an inline error and does not dispatch an over-balance withdrawal', async () => {
  const { store } = renderWithStore(<TransactionForm goalId="g1" />, {
    goals: [
      {
        id: 'g1',
        title: 'Отпуск',
        targetAmount: 1000,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 't1',
        goalId: 'g1',
        type: 'deposit',
        amount: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });
  await userEvent.click(screen.getByRole('button', { name: 'Снять' }));
  await userEvent.type(screen.getByLabelText('Сумма'), '101');
  await userEvent.click(
    screen.getByRole('button', { name: 'Добавить операцию' })
  );
  expect(
    screen.getByText('Нельзя снять больше, чем накоплено')
  ).toBeInTheDocument();
  expect(store.getState().transactions).toHaveLength(1);
});
```

- [ ] **Step 2: Run detail-feature tests and verify failure**

Run:

```bash
npm test -- --watchAll=false --runInBand src/features/add-transaction/ui/TransactionForm.test.tsx src/widgets/goal-details/ui/TransactionsHistory.test.tsx
```

Expected: failure because the detail feature modules do not exist.

- [ ] **Step 3: Implement the transaction form with dual validation**

Keep `type` (`deposit` by default) and `amount` input strings local. Before dispatching, reject invalid positive-integer input; for withdrawals, compare with the selector-derived balance and show exactly `Нельзя снять больше, чем накоплено`. On success dispatch:

```ts
transactionsActions.transactionCreated({
  id: createId('transaction'),
  goalId,
  type,
  amount: Number(amount),
  createdAt: createTimestamp(),
});
```

The root reducer remains the second, state-level guard. Reset the amount only after dispatching a valid transaction.

- [ ] **Step 4: Implement summary, history, and confirmed transaction deletion**

`GoalSummary` displays current formatted balance, rounded progress percentage, and `ProgressBar`. `TransactionsHistory` filters by `goalId`, sorts by `createdAt` descending with `id` as deterministic tie-breaker, and shows Russian type labels, sign/color, formatted amount, and formatted date. `DeleteTransactionButton` uses `Dialog` confirmation and dispatches `transactionsActions.transactionRemoved(id)` only after confirm.

- [ ] **Step 5: Compose and style the detail page**

Use `useParams` to resolve the goal, render the not-found state before mounting feature UI, and compose back link, `GoalSummary`, `EditGoalDialog`, `DeleteGoalButton`, `TransactionForm`, and `TransactionsHistory`. On small widths, stack actions and panels vertically without horizontal overflow.

- [ ] **Step 6: Run all detail tests, lint, and build**

Run:

```bash
npm test -- --watchAll=false --runInBand src/features/add-transaction/ui/TransactionForm.test.tsx src/widgets/goal-details/ui/TransactionsHistory.test.tsx
npm run lint
npm run build
```

Expected: transaction flow and history tests pass; the application compiles without lint errors.

- [ ] **Step 7: Commit the detail feature**

```bash
git add src/features src/widgets src/pages
git commit -m "feat: add goal transaction detail flow"
```

## Task 6: Complete regression coverage and manually verify the responsive MVP

**Files:**

- Modify: domain, persistence, shared, feature, widget, and page files only where verification uncovers a concrete defect.
- Create if needed: `src/app/App.integration.test.tsx` for route-level smoke coverage.

**Interfaces:**

- Consumes: all completed application interfaces.
- Produces: an independently verified MVP with no behaviour beyond the approved scope.

- [ ] **Step 1: Add a route-level regression test**

Write a test that preloads a goal, opens `/goals/g1`, verifies the detail title and balance, then renders `/goals/missing` and verifies `Цель не найдена`. Use a memory-router provider only in the test; production continues to use `BrowserRouter`.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test -- --watchAll=false --runInBand
```

Expected: all reducer, selector, persistence, UI, and route tests pass.

- [ ] **Step 3: Run static checks and production build**

Run:

```bash
npm run lint
npm run format:check
npm run build
```

Expected: all commands complete with exit code 0. If Prettier reports formatting, run `npm run format`, review its focused diff, and rerun `format:check`.

- [ ] **Step 4: Perform a manual browser smoke check**

Run the application, then verify at desktop and mobile viewport widths:

```bash
npm start
```

Create a goal, confirm it starts at `0 ₽`, add a deposit, reject an over-balance withdrawal, remove a transaction after confirmation, verify card navigation, refresh the page for persistence, and open an unknown detail URL for the not-found state.

- [ ] **Step 5: Commit final verification fixes**

```bash
git add src
git commit -m "test: verify goal tracker MVP flows"
```

Commit only if Task 6 changes tracked source or tests; do not create an empty commit.

## Plan Self-Review

### Spec coverage

| Spec requirement                                          | Plan task            |
| --------------------------------------------------------- | -------------------- |
| React, TypeScript, Redux Toolkit, SCSS, FSD, router       | Tasks 1–3            |
| Goal CRUD and zero starting balance                       | Task 4               |
| Ledger transactions, non-negative balance, progress       | Task 2 and Task 5    |
| Overview and detail routes                                | Tasks 3–5            |
| LocalStorage hydration and safe fallback                  | Tasks 1–2            |
| Russian ₽ interface, Manrope, responsive layouts          | Tasks 1, 3–5         |
| Delete confirmations and unknown route                    | Tasks 3–5            |
| Reducer/selector/persistence tests and final verification | Tasks 1–2 and Task 6 |

### Placeholder scan

The plan contains no deferred work markers or unspecified validation paths. Each validation, failure case, action name, route, command, and cross-task interface is defined above.

### Type consistency

All tasks use `Goal`, `Transaction`, `RootState`, `goalsActions`, `transactionsActions`, `calculateBalance`, and `calculateProgress` with the same names and property shapes. Amounts remain JavaScript `number` values constrained to positive integers throughout the stack.
