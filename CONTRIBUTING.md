# Contributing

## Git workflow

1. Start each task on a separate branch from the intended up-to-date base branch. Never commit directly to `main`; use a descriptive English name such as `feat/goal-export`, `fix/withdrawal-validation`, or `docs/git-workflow`. If a branch already belongs to another task, create a new one rather than mixing work.
2. Keep changes focused. Make small, logically independent commits that leave the project in a coherent state. Review `git status` and `git diff` before staging, and stage only files belonging to the task.
3. Write commit messages in English using the existing Conventional Commits style: `type(scope): short imperative summary`. The scope is optional. Examples: `feat(goal): add export`, `fix: prevent negative balance`, and `docs: clarify setup`. Use the body when the reason or tradeoff needs explanation.
4. Push the branch and open a pull request against the intended base when the work is ready for review. Describe the problem, the change, and the checks performed; mention migrations or configuration changes. Address review feedback with focused commits.
5. Do not rewrite shared history or force-push without coordinating with collaborators. Do not commit secrets, local environment files, generated build output, or unrelated changes.

## Checks

Install dependencies with `npm ci`. For a typical application change, run the checks used by CI:

```sh
npm run lint
npm run format:check
npm run typecheck
npm test -- --silent
npm run build
npm run test:e2e
```

The browser tests require Playwright's Chromium (`npx playwright install chromium`). For database changes, also run `supabase db start`, `supabase test db`, and `bash supabase/tests/concurrent_withdrawals.sh` with `DATABASE_URL` pointing to the local Supabase database. These checks require Supabase CLI, Docker, Bash, and `psql`; CI runs them as well. For documentation-only changes, check formatting and links relevant to the edit. State any checks not run in the pull request.

## Documentation and migrations

Keep [README.md](README.md) and [README.ru.md](README.ru.md) aligned when changing shared setup or product behavior. Add a new migration for database changes instead of editing an already-applied migration, and describe any deployment ordering or configuration changes in the pull request and relevant documentation.
