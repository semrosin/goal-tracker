# Task 1 report: Restore and guard the application root composition

## Implemented changes

- Restored `App` to compose the Redux `Provider`, `BrowserRouter`, and exactly one `AppRouter` child.
- Added `src/app/App.test.tsx`, which verifies that rendering the application root produces the overview heading (`Мои цели`).
- Did not restore `AppProviders`, change routes, or modify webpack/package tooling.

## TDD evidence

### RED

Command:

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/App.test.tsx
```

Result: FAIL (exit code 1). The test could not reach the recursive render because the existing installed dependencies fail first with `Cannot find module 'react-router/dom'` from `react-router-dom`.

### GREEN implementation

The self-reference in `App.tsx` was replaced with `<AppRouter />`, and the `AppRouter` import was added. The focused test was rerun, but it remains blocked by the same pre-existing dependency-resolution error.

## Verification

Focused and route tests:

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/App.test.tsx src/app/router/AppRouter.test.tsx src/app/App.integration.test.tsx
```

Result: FAIL (exit code 1): `AppRouter.test.tsx` and `App.integration.test.tsx` passed; `App.test.tsx` failed during module loading with `Cannot find module 'react-router/dom'`.

Full suite:

```powershell
npm.cmd test -- --watchAll=false --runInBand
```

Result: FAIL (exit code 1): 21 suites passed, 1 suite failed (`src/app/App.test.tsx`); 100 tests passed. The only failure is the same `react-router/dom` module-resolution error.

## Changed files

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `.superpowers/sdd/2026-09-02-cra-to-webpack-migration/task-1-report.md`

## Self-review

- The root owns `Provider` and `BrowserRouter` and renders one `AppRouter`; no recursive `<App />` remains.
- The regression test exercises the public root rather than bypassing it.
- Scope is limited to the two source files required by the brief plus this report.

## Concerns

The checked-out `node_modules` is incomplete/inconsistent with the declared `react-router-dom` dependency: `react-router-dom@7.18.3` cannot resolve its required `react-router/dom` module. Package/webpack tooling was intentionally not changed for this task, so the new root test cannot reach assertion execution until the dependency installation is repaired by the migration/tooling work.
