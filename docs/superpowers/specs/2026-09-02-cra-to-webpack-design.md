# CRA-to-webpack migration design

**Date:** 2026-09-02
**Status:** approved for specification review

## Goal

Replace Create React App completely with directly owned webpack, Babel,
Jest, ESLint, and TypeScript tooling. The application must keep its current
React entry point, SCSS/CSS Module behavior, routes, test suite, and `build/`
output convention while no longer depending on `react-scripts`.

## Scope and constraints

- Remove `react-scripts`, its scripts, the `eject` script, and its implicit
  ESLint configuration.
- Keep the existing React application and FSD source structure. The migration
  does not change product behavior or Redux state.
- Preserve `npm start`, `npm run build`, `npm test`, `npm run lint`, and
  `npm run format:check` as the normal developer interface. Add explicit
  `typecheck` and watch-test commands where useful.
- Preserve the `/` and `/goals/:id` routes in local development through an
  SPA fallback. Production hosts must likewise rewrite unknown application
  routes to `index.html`.
- Preserve direct browser support targets through `browserslist` in
  `package.json`. This is a standard Babel/PostCSS input, not webpack
  configuration and not a remaining CRA dependency.
- The working tree already contains unrelated edits to `src/app/App.tsx`,
  `src/index.tsx`, and `src/app/providers/AppProviders.tsx`; migration work
  must not overwrite or stage them.

## Chosen configuration layout

Use three webpack configuration files under `webpack/`:

```text
webpack/
  webpack.common.cjs  # entry, module rules, HTML/public assets, resolution
  webpack.dev.cjs     # development source maps and dev server
  webpack.prod.cjs    # hashed output, extracted/minified CSS, cleanup
```

`webpack-merge` combines `common` with the active environment configuration.
This avoids mode checks throughout one large file: development concerns such
as HMR and the dev server stay out of production output settings, while style,
TypeScript, and asset rules are defined once.

`package.json` remains the command/dependency manifest only. Its scripts will
call the selected webpack config, for example `webpack serve --config ...` and
`webpack --config ...`; it will not contain loaders, aliases, output, or
development-server rules.

## Build and development behavior

### JavaScript and TypeScript

- `src/index.tsx` remains the entry point.
- `babel-loader` with `@babel/preset-env`, `@babel/preset-react`, and
  `@babel/preset-typescript` compiles `.js`, `.jsx`, `.ts`, and `.tsx` files.
- `@babel/preset-env` consumes the existing `browserslist` targets.
- `ForkTsCheckerWebpackPlugin` makes webpack builds fail on TypeScript errors;
  `npm run typecheck` runs `tsc --noEmit` directly for an explicit fast check.
  Babel performs transpilation only and never substitutes for type checking.
- Resolve the standard JavaScript and TypeScript extensions. Keep existing
  import paths unchanged and make `react-router` a direct dependency because
  source code imports it directly.

### Styles and assets

- `*.module.scss` is processed as CSS Modules; regular `.scss` remains global.
  Development injects styles with `style-loader`; production extracts them
  with `MiniCssExtractPlugin`.
- Both SCSS paths run through Sass, PostCSS, and CSS loaders. An explicit
  `postcss.config.cjs` with Autoprefixer consumes `browserslist`, preserving
  CRA-era browser-prefix behavior without relying on CRA.
- Webpack Asset Modules handle future imported images/fonts without extra
  loaders. Their production names include content hashes.
- `HtmlWebpackPlugin` injects compiled bundles into `public/index.html`.
  The template is cleaned of CRA-only `%PUBLIC_URL%` interpolation and
  boilerplate comments.
- `CopyWebpackPlugin` copies public files other than `index.html`, including
  `manifest.json` and `robots.txt`, to `build/`.
- `manifest.json` currently references non-existent CRA starter icons. Remove
  those broken icon entries rather than claiming assets that the project does
  not ship.

### Development and production

- `npm start` runs `webpack-dev-server` on port 3000 with HMR, a browser-open
  behavior, and `historyApiFallback: true`.
- Development uses source maps appropriate for debugging.
- `npm run build` emits a clean `build/` directory using content-hashed JS,
  CSS, and static asset names. JavaScript uses webpack production minimization;
  CSS uses an explicit CSS minimizer. The generated HTML references the
  hashed files automatically.
- The browser app uses root-relative routing and `output.publicPath: '/'`.
  Deployment under a subpath is intentionally out of scope for this migration.

## Quality-tool ownership

### Tests

Webpack does not execute tests, so CRA's hidden Jest setup is replaced with
direct Jest ownership:

- `jest.config.cjs` selects jsdom, loads `src/setupTests.ts`, and transforms
  TypeScript/TSX with `babel-jest`.
- Jest and `@types/jest` use aligned v30 releases instead of the current
  transitive CRA Jest runtime.
- CSS Modules map to `identity-obj-proxy`, preserving tests that assert module
  class names. Other style and static asset imports map to lightweight test
  mocks.
- `npm test` runs the suite once for reliable CI behavior; `npm run
  test:watch` provides interactive watch mode.

### Linting and formatting

- Add an explicitly owned ESLint configuration for TypeScript, React, React
  Hooks, JSX accessibility, and Jest test files. Remove `eslintConfig` that
  extends `react-app` / `react-app/jest`.
- Keep the existing Prettier configuration and scripts unchanged.

## Package and script contract

`package.json` will directly list every tool used by the scripts/configuration:
webpack and its CLI/server/merge utilities, Babel packages, CSS/Sass/PostCSS
loaders and plugins, HTML/public-copy plugins, fork type checking, Jest/jsdom
and Babel transform support, CSS identity mocks, and direct ESLint plugins.
`react-scripts` and unused `web-vitals` are removed. `package-lock.json` is
regenerated from that explicit dependency set.

Expected scripts:

```text
start       webpack serve with webpack.dev.cjs
build       webpack with webpack.prod.cjs
test        jest --runInBand
test:watch  jest --watch
lint        eslint over source/test/config files
typecheck   tsc --noEmit
format      unchanged Prettier write command
format:check unchanged Prettier check command
```

## Documentation and failure behavior

- Update the README with install, start, build, test, lint, and type-check
  commands plus the hosting requirement for SPA history fallback.
- Missing `#root` continues to throw from the existing entry point.
- Compilation errors surface in the dev server and make production builds
  fail; TypeScript errors do the same through the checker.
- Missing or malformed public assets fail build-time processing where webpack
  can detect them. The supplied manifest no longer claims absent icon files.

## Verification criteria

The migration is complete only when all of the following pass after a clean
dependency install:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test -- --runInBand`
4. `npm run build`
5. `npm start`, including a direct request to `/goals/example`, returns the
   SPA shell rather than a 404.

The final review also confirms that `react-scripts`, `eject`, CRA-only
`%PUBLIC_URL%`, and `react-app` ESLint inheritance are absent, and that the
pre-existing user edits remain unstaged and unchanged.
