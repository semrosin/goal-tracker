# Goal Tracker Final Integrity Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the final-review data-loss, canonical-state, FSD-boundary, and safe-deletion UX issues without expanding MVP scope.

**Architecture:** Establish the ledger aggregate in the `entities` layer as the one canonical authority for state decoding and ordered balance-prefix validation. The `app` layer will keep only store/persistence composition, while all lower UI layers consume typed hooks and test helpers from the neutral ledger aggregate. Safe transaction deletion will expose the already-enforced ledger invariant to the user rather than silently closing a rejected confirmation.

**Tech Stack:** React 19, TypeScript, Redux Toolkit, React Redux, React Router, SCSS modules, Jest/Testing Library, Prettier.

**Spec:** `docs/superpowers/specs/2026-08-29-goal-tracker-mvp-design.md`

## Global Constraints

- Keep the Redux state canonically limited to `{ goals, transactions }`; neither root nor entity objects may retain `savedAmount` or arbitrary runtime properties.
- Goal targets and transaction amounts are positive whole rubles. Goals always begin at zero with no generated transaction.
- The ledger array/insertion order is the domain execution order. Every per-goal running prefix must remain non-negative; UI history sorting is presentation-only.
- Unknown/malformed localStorage snapshots and duplicate persisted IDs fall back safely to the empty state; supported unknown entity fields are stripped by canonical decoding.
- No lower FSD layer (`pages`, `widgets`, `features`, `entities`, `shared`) imports from a higher one. Entity tests remain entity-local; application tests may compose app code.
- Preserve Russian UTF-8 UI, responsive layouts, confirmed deletions, and all approved MVP exclusions.
- Use true RED → GREEN TDD. Test execution evidence must use a registered non-hidden detached worktree at the exact candidate SHA because CRA/Jest ignores the hidden `.worktrees` ancestor.

---

### Task 1: Canonical ledger aggregate and persistence-safe ordered invariants

**Files:**

- Create: `src/entities/ledger/model/ledger.ts`
- Create: `src/entities/ledger/model/ledger.test.ts`
- Modify: `src/app/store/rootReducer.ts`
- Modify: `src/app/store/persistence.ts`
- Modify: `src/app/store/persistence.test.ts`
- Modify: `src/app/store/store.ts`
- Create: `src/app/store/store.test.ts`
- Modify: `src/entities/goal/model/goalSlice.test.ts`
- Modify: `src/entities/transaction/model/transactionSlice.test.ts`

**Interfaces:**

- Consumes: `Goal`, `GoalUpdate`, `Transaction`, `goalsActions/goalsReducer`, `transactionsActions/transactionsReducer`, `isPositiveInteger`, safe storage adapter.
- Produces: `LedgerState`, `ledgerInitialState`, `ledgerReducer`, `decodeLedgerState(value): LedgerState | undefined`, `serializeLedgerState(state): LedgerState`, and a pure ordered-prefix validator from the entity aggregate. `app/store/rootReducer.ts` remains a compatibility re-export only.

- [ ] **Step 1: Add failing ledger and persistence tests**

Add literal fixtures and expectations that name the bug:

```ts
const validLedger = [
  {
    id: 'd1',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'w1',
    goalId: 'g1',
    type: 'withdrawal',
    amount: 100,
    createdAt: '2026-01-01T00:01:00.000Z',
  },
  {
    id: 'd2',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:02:00.000Z',
  },
];

expect(
  ledgerReducer(
    { goals: [goal], transactions: validLedger },
    transactionsActions.transactionRemoved('d1')
  )
).toEqual({ goals: [goal], transactions: validLedger });
```

Also test that `[w1, d2]` is rejected by `loadPersistedState`, that dispatch → persistence save → reload preserves the original valid ledger, a per-goal `savedAmount` and an arbitrary transaction property are stripped, duplicate goal IDs/transaction IDs return `undefined`, and saving a polluted state emits only canonical keys.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm.cmd test -- --watchAll=false --runInBand src/entities/ledger/model/ledger.test.ts src/app/store/persistence.test.ts src/app/store/store.test.ts
```

Expected: deletion test fails because current reducer checks only final aggregate balance; decoder/persistence tests fail because canonical aggregate APIs do not exist or preserve unknown entity properties/duplicates.

- [ ] **Step 3: Implement canonical decode/encode and single ordered-prefix rule**

Implement entity-layer helpers that create fresh literals:

```ts
export type LedgerState = { goals: Goal[]; transactions: Transaction[] };

export const hasNonNegativeBalancePrefixes = (
  transactions: readonly Transaction[]
): boolean => {
  const balances = new Map<string, number>();
  for (const transaction of transactions) {
    const previous = balances.get(transaction.goalId) ?? 0;
    const next =
      previous +
      (transaction.type === 'deposit'
        ? transaction.amount
        : -transaction.amount);
    if (next < 0) return false;
    balances.set(transaction.goalId, next);
  }
  return true;
};
```

`decodeLedgerState` must require arrays, decode each entity to a fresh exact `Goal` or `Transaction`, reject nonunique IDs, reject orphan transactions, and apply `hasNonNegativeBalancePrefixes` without sorting. `serializeLedgerState` must create fresh exact object literals even when a caller supplied polluted state.

`ledgerReducer` must use decoded/canonical action payloads before invoking entity slices, reject malformed/duplicate direct actions, validate `[...state.transactions, transaction]` on creation, validate `remainingTransactions` on removal, and preserve atomic goal → transaction cascade. Re-export the resulting reducer/state symbols from `app/store/rootReducer.ts`; use the decoder for both `loadPersistedState` and explicit `createAppStore(preloadedState)` input.

- [ ] **Step 4: Verify GREEN and non-regression**

Run the focused tests, then all tests. Check a same-timestamp deposit-then-withdrawal remains valid according to array order rather than presentation sort order.

```powershell
npm.cmd test -- --watchAll=false --runInBand src/entities/ledger/model/ledger.test.ts src/app/store/persistence.test.ts src/app/store/store.test.ts
npm.cmd test -- --watchAll=false --runInBand
```

- [ ] **Step 5: Commit domain integrity repair**

```powershell
git add src/entities/ledger src/app/store src/entities/goal/model/goalSlice.test.ts src/entities/transaction/model/transactionSlice.test.ts
git commit -m "fix: preserve valid ledger state across persistence"
```

### Task 2: Move Redux boundary downward to satisfy FSD imports

**Files:**

- Create: `src/entities/ledger/model/hooks.ts`
- Create: `src/entities/ledger/testing/renderWithLedger.tsx`
- Create: `src/entities/ledger/index.ts`
- Modify: `src/app/store/hooks.ts`
- Modify: `src/app/test/renderWithStore.tsx`
- Modify: all production components currently importing `../../../app/store/hooks`
- Modify: feature/widget tests currently importing `app/test/renderWithStore`
- Modify: `src/widgets/goals-list/ui/GoalsList.test.tsx`
- Create: `src/app/fsdBoundaries.test.ts`

**Interfaces:**

- Consumes: Task 1 `LedgerState`, `ledgerReducer`, ledger initial state; React Redux hooks; Testing Library and `MemoryRouter`.
- Produces: entity-level `useLedgerDispatch`, `useLedgerSelector`, `renderWithLedger`, and a re-export-compatible app helper for application-layer tests. Lower layers import only `entities/ledger` public APIs.

- [ ] **Step 1: Write failing dependency-boundary and helper tests**

Add a lightweight Node-backed Jest test that scans relative `.ts`/`.tsx` imports under `src` and fails when a lower FSD rank imports a higher rank. Include a component test using `renderWithLedger` to prove the helper creates a real configured store and `MemoryRouter` without the app layer.

The import rank test must fail for the current examples:

```ts
// feature/widget -> app is forbidden
import { useAppDispatch } from '../../../app/store/hooks';
// entity test -> app is forbidden
import { rootReducer } from '../../../app/store/rootReducer';
```

- [ ] **Step 2: Run boundary test and verify RED**

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/fsdBoundaries.test.ts
```

Expected: reports the present `features/widgets/pages -> app`, `entities -> app`, and `widgets -> pages` lower-to-higher imports.

- [ ] **Step 3: Implement entity-level hooks and migrate imports**

Implement typed hooks against Task 1's `LedgerState` with `Dispatch<UnknownAction>`:

```ts
export const useLedgerDispatch = () => useDispatch<Dispatch<UnknownAction>>();
export const useLedgerSelector: TypedUseSelectorHook<LedgerState> = useSelector;
```

Create `renderWithLedger` from `configureStore({ reducer: ledgerReducer, preloadedState: decodeLedgerState(preloadedState) ?? ledgerInitialState })` and `MemoryRouter`. Migrate production pages/widgets/features to ledger hooks and lower-level tests to that helper. Move only aggregate reducer tests into `entities/ledger/model/ledger.test.ts`; retain entity slice tests as slice-local. Move the page-level assertion out of `GoalsList.test.ts` to a page/app test so widgets do not import pages. Keep `app/store/hooks.ts` and `app/test/renderWithStore.tsx` as app-level re-export/facade only when needed by app tests.

- [ ] **Step 4: Verify GREEN**

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/fsdBoundaries.test.ts
npm.cmd test -- --watchAll=false --runInBand
```

Expected: no lower-to-higher relative imports and all UI/reducer tests remain green.

- [ ] **Step 5: Commit FSD boundary repair**

```powershell
git add src
git commit -m "refactor: move ledger store boundary below app"
```

### Task 3: Explain rejected deletion and complete deletion accessibility

**Files:**

- Modify: `src/features/delete-transaction/ui/DeleteTransactionButton.tsx`
- Create or modify: `src/features/delete-transaction/ui/DeleteTransactionButton.module.scss`
- Modify: `src/features/add-transaction/ui/TransactionForm.module.scss` only if shared error styling is not reusable
- Modify: `src/widgets/goal-details/ui/TransactionsHistory.tsx`
- Modify: `src/widgets/goal-details/ui/TransactionsHistory.test.tsx`
- Modify: `src/shared/ui/Dialog/Dialog.module.scss`

**Interfaces:**

- Consumes: Task 1 ordered-prefix ledger validator, typed entity ledger selector/dispatch hooks, transaction row data, `formatRubles`, `formatDate`, shared `Dialog` and `Button`.
- Produces: a rejected-deletion explanation, unique row-specific delete labels, and a 44 × 44px dialog close target without changing deletion semantics.

- [ ] **Step 1: Add failing user-behavior tests**

Test that a deposit deletion which would leave `[withdrawal 100, deposit 100]` invalid keeps the confirmation open, displays a Russian `role="alert"`, and preserves the transaction. Test that two history delete buttons have distinct accessible names containing their transaction context. Test cancel remains a no-op.

- [ ] **Step 2: Run the focused tests and verify RED**

```powershell
npm.cmd test -- --watchAll=false --runInBand src/widgets/goal-details/ui/TransactionsHistory.test.tsx
```

Expected: current dialog closes silently and generic delete labels are ambiguous.

- [ ] **Step 3: Implement user-visible safe rejection**

Before dispatch, derive the candidate remaining sequence with the Task 1 validator. When invalid, keep the dialog open and render a concise Russian message such as `Нельзя удалить операцию: это приведёт к отрицательному балансу`. When valid, dispatch and close normally. Pass a context-specific `aria-label` from each history row (type, formatted amount, date). Set dialog close button `min-width` and `min-height` to `44px`.

- [ ] **Step 4: Verify GREEN and all quality gates**

```powershell
npm.cmd test -- --watchAll=false --runInBand src/widgets/goal-details/ui/TransactionsHistory.test.tsx
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
git diff --check
```

- [ ] **Step 5: Commit deletion UX/accessibility repair**

```powershell
git add src
git commit -m "fix: explain blocked transaction deletion"
```

## Self-Review

### Spec coverage

| Requirement                                                   | Repair task                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ledger withdrawals cannot make balances negative              | Task 1 applies one ordered-prefix rule to creation, removal, hydration, and tests.                 |
| Safe localStorage malformed-data fallback and no saved amount | Task 1 canonical decoder/encoder strips entity extras and rejects duplicate/invalid snapshots.     |
| FSD direction                                                 | Task 2 removes lower-to-higher runtime and test imports and locks it with a test.                  |
| Confirmed deletion and accessible Russian UX                  | Task 3 keeps confirmation, explains rejection, distinguishes delete buttons, and fixes touch size. |
| Quality gates                                                 | Each task uses focused RED/GREEN; Task 3 reruns full test/lint/format/build/diff checks.           |

### Placeholder scan

The plan specifies concrete files, interfaces, fixtures, commands, expected failures, canonical APIs, and commit messages. It contains no deferred implementation placeholders.

### Type consistency

`LedgerState`, `ledgerInitialState`, `ledgerReducer`, `decodeLedgerState`, `serializeLedgerState`, `hasNonNegativeBalancePrefixes`, `useLedgerDispatch`, `useLedgerSelector`, and `renderWithLedger` are defined in Task 1/2 and consumed with the same names later. Ledger order is explicitly array order throughout.
