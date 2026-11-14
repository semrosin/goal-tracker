# Agent instructions

## Project context

GoalCraft is a bilingual savings goal tracker built with React, TypeScript, Redux Toolkit, React Router, SCSS/CSS Modules, and Supabase. Read [README.md](README.md) for the current features, architecture, setup, and commands. The historical documents under `docs/superpowers/` describe earlier work and are not the current product specification.

## Working practices

- Follow [CONTRIBUTING.md](CONTRIBUTING.md), including the branch, commit, and review conventions. Inspect the working tree before changing it and preserve unrelated changes.
- Keep changes focused and consistent with existing patterns. Update the English and Russian READMEs when a change affects their shared product or setup information.
- Keep the UI usable in Russian and English; update both translations when changing user-facing text. Format amounts according to the goal currency and existing conventions.
- Respect the Feature-Sliced Design dependency direction: `app` ? `pages` ? `widgets` ? `features` ? `entities` ? `shared`. Keep reusable domain calculations out of page components.
- Derive balances and progress from the ordered transaction ledger. Preserve non-negative balance validation, transaction ordering, and the separation of local demo data from cloud accounts.
- Treat the database as authoritative for cloud data. Maintain owner isolation, RPC validation, and concurrency protections when changing Supabase migrations or client operations. Never put service-role or secret keys in browser configuration.
- Add or update meaningful tests for changed behavior. Run checks appropriate to the change; report any checks that could not be run. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full CI checks.
