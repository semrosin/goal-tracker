# goal-tracker

A pet project for tracking financial goals.

## Development

Install dependencies and use the direct webpack/Jest toolchain:

```text
npm ci
npm start
npm run build
npm test
npm run test:watch
npm run lint
npm run typecheck
npm run format:check
```

`npm start` serves the application at http://localhost:3000. The local webpack development server handles client-side deep links, including `/goals/example`.

## Production deployment

`npm run build` emits the production bundle to `build/`. Configure the production host to rewrite client routes such as `/goals/example` to `/index.html`; the development server's deep-link fallback does not replace this deployment requirement.
