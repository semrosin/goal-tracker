# Final review remediations — implementation plan

> **Owner:** implementation agents follow this plan task by task. Each task uses test-first evidence, a focused commit, independent review, and a non-hidden verifier for final gates.

## Context

The final MVP review at `652488cb` found one important accessibility gap: `Dialog` declares itself modal but does not move, contain, or restore keyboard focus. It also identified two small correctness/polish gaps: integers above JavaScript's safe range can be rounded, and installed-app metadata remains the CRA English placeholder. A final architecture observation is that cross-slice imports bypass segment entry points; align those imports with FSD public APIs without changing runtime behavior.

## Task 1: Make shared dialogs keyboard-modal

**Files:**

- Modify: `src/shared/ui/Dialog/Dialog.tsx`
- Modify: `src/shared/ui/Dialog/Dialog.test.tsx`

**Implementation:**

1. Record the active opener when a dialog opens, then place focus on a deterministic control inside the dialog (the labelled close control is suitable).
2. Trap `Tab` and `Shift+Tab` among focusable controls while open; retain existing Escape and backdrop behavior.
3. Restore focus to the opener after every close route without re-running the focus lifecycle when a parent merely re-renders.
4. Preserve the existing `role="dialog"`, `aria-modal`, title relationship, 44 × 44px close target, and Russian close label.

**Tests (RED then GREEN):**

- A trigger opens a dialog and focus moves inside.
- `Tab` from the last control wraps to the first; `Shift+Tab` from the first wraps to the last.
- Closing through the close control and Escape restores focus to the trigger; ensure a background control is not reached while open.

**Verification:** focused Dialog suite, full tests, lint, format, build, and `git diff --check` in a non-hidden verifier.

## Task 2: Preserve exact whole-ruble values and finish product metadata

**Files:**

- Modify: `src/shared/lib/validation.ts`
- Modify: `src/shared/lib/validation.test.ts`
- Modify: `src/entities/ledger/model/ledger.ts`
- Modify: `src/entities/ledger/model/ledger.test.ts`
- Modify: `public/index.html`
- Modify: `public/manifest.json`

**Implementation:**

1. Define positive whole rubles as positive _safe_ integers. Reject values outside `Number.MAX_SAFE_INTEGER` and reject ledger prefix sums that cannot remain safe integers.
2. Keep all ordinary whole-ruble flows unchanged; malformed/overflowing persisted snapshots fall back through the existing safe decoder path.
3. Replace public CRA English title/name/description with Russian Goal Tracker metadata.

**Tests (RED then GREEN):**

- Maximum safe whole ruble is accepted; an unsafe integer is rejected.
- A second otherwise-valid transaction that would overflow a ledger prefix leaves the state unchanged; an overflowing snapshot is rejected.

**Verification:** focused validation/ledger tests, full quality gates in non-hidden verifier.

## Task 3: Use FSD segment public APIs for cross-layer composition

**Files:**

- Create relevant `index.ts` public entry points under `entities/goal`, `entities/transaction`, `features/*`, and `widgets/*`.
- Modify cross-layer imports in pages/widgets/features to consume only those public entry points.
- Modify: `src/app/fsdBoundaries.test.ts` and/or add focused expectations if needed.

**Implementation:**

1. Re-export only the UI/model APIs already consumed outside each slice; do not change state semantics or create barrel cycles.
2. Update consumers that cross segment boundaries; intra-segment relative imports may remain local.
3. Extend the static FSD guard to reject deep imports across a different slice when a public entry point exists, while allowing local implementation imports.

**Tests (RED then GREEN):**

- The boundary suite fails on a representative cross-slice deep import and passes with public entry points.
- Existing app/UI tests continue to pass unchanged in behavior.

**Verification:** full quality gates and final architecture review in a non-hidden verifier.

## Final verification

After Task 3, run from the exact final SHA in a registered non-hidden worktree:

`npm.cmd test -- --watchAll=false`

`npm.cmd run lint`

`npm.cmd run format:check`

`npm.cmd run build`

`git diff --check 660fb64..HEAD`

Then request a final independent review of data integrity, accessibility, FSD boundaries, and the original MVP requirements before integration.
