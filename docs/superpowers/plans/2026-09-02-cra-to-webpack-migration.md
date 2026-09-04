# CRA-to-webpack Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Create React App with explicitly owned webpack, Babel, PostCSS, Jest, ESLint, and TypeScript tooling while preserving the application's current behavior and developer commands.

**Architecture:** Three webpack configurations compose a common compilation/asset layer with separate development-server and production-output layers. Babel compiles TypeScript/React, ForkTsChecker retains type diagnostics, and PostCSS consumes the existing `browserslist` browser targets. Jest and ESLint move to direct configuration because neither is a webpack responsibility.

**Tech Stack:** webpack 5, webpack-dev-server, Babel 7, TypeScript 4.9, Sass, PostCSS/Autoprefixer, Jest 30, ESLint 8, React 19, React Router 7.

**Spec:** `docs/superpowers/specs/2026-09-02-cra-to-webpack-design.md`

## Global Constraints

- Remove `react-scripts`, its `eject` command, its `react-app` ESLint inheritance, and unused `web-vitals` completely.
- Keep webpack rules in `webpack/*.cjs`; keep `package.json` limited to dependencies, npm scripts, and the existing `browserslist` target declaration.
- Use `webpack/webpack.common.cjs`, `webpack/webpack.dev.cjs`, and `webpack/webpack.prod.cjs`; do not create one mode-conditional mega-config.
- Preserve `src/index.tsx` as the application entry point, global `src/app/styles/global.scss`, all `*.module.scss` default imports, the `build/` output directory, and root-hosted routes.
- Preserve direct routes `/` and `/goals/:id` in the webpack dev server through history fallback. Document that the production host must perform the equivalent rewrite to `index.html`.
- Preserve browser support targets in `package.json` and use them explicitly through Babel and Autoprefixer.
- The existing source imports `react-router` directly. Make it a direct runtime dependency matching `react-router-dom` instead of depending on npm hoisting.
- Preserve every existing Jest suite, `src/setupTests.ts`, CSS Module class-name behavior, and CommonJS `__dirname` support used in `Dialog.test.tsx`.
- Do not refactor product code. The only source exception is Task 1: it restores a proven one-line application-root regression introduced in commit `ce9052b5`, so that the migrated application can actually render and be smoke-tested.
- Run every command with `npm.cmd` in PowerShell. Do not overwrite unrelated user changes; implementation runs in an isolated worktree.

---

## Target File Structure

```text
.
  .eslintrc.cjs                         # owned ESLint 8 configuration
  babel.config.cjs                      # Babel presets shared by webpack and Jest
  jest.config.cjs                       # direct Jest environment, transforms, and mocks
  postcss.config.cjs                    # Autoprefixer reading package browserslist
  package.json                          # direct tool dependencies and npm commands
  package-lock.json                     # exact resolved dependency graph
  public/
    index.html                          # HtmlWebpackPlugin template without CRA tokens
    manifest.json                       # valid metadata without missing starter icons
    robots.txt                           # copied unchanged
  src/
    app/
      App.tsx                           # Provider + BrowserRouter + AppRouter composition
      App.test.tsx                      # regression guard for the application root
  test/
    fileMock.cjs                        # Jest static-asset stub
    styleMock.cjs                       # Jest global-style stub
  webpack/
    webpack.common.cjs                  # entry, transpilation, styles, HTML, public copy
    webpack.dev.cjs                     # HMR, dev source maps, SPA dev-server fallback
    webpack.prod.cjs                    # content-hashed output, extracted/minified CSS
  README.md                             # direct-tool commands and deployment note
```

`src/types/styles.d.ts` remains unchanged: its default `Record<string, string>` declaration matches CSS Modules configured with `namedExport: false`.

## Task 1: Restore and guard the application root composition

**Files:**

- Create: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

**Interfaces:**

- Consumes: `store` from `src/app/store/store.ts` and `AppRouter` from `src/app/router/AppRouter.tsx`.
- Produces: the default `App` component that owns `Provider`, `BrowserRouter`, and exactly one `AppRouter` child.

The latest `refactor providers` commit moved providers into `App` but changed its child from `AppRouter` to `App`. That recursively renders the same component forever; the current route tests bypass `App`, so all 100 baseline tests pass without detecting it.

- [ ] **Step 1: Write a failing root-render regression test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders the overview route through the application root', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Мои цели' })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the recursion failure**

Run:

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/App.test.tsx
```

Expected: FAIL while React renders `App` recursively; the overview heading is never produced.

- [ ] **Step 3: Restore the intended router child**

Replace the self-reference in `src/app/App.tsx` with the previous public router:

```tsx
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { AppRouter } from './router/AppRouter';
import { store } from './store/store';

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </Provider>
);

export default App;
```

Do not restore the deleted `AppProviders` abstraction or alter application routes in this task.

- [ ] **Step 4: Verify the focused and existing route tests**

Run:

```powershell
npm.cmd test -- --watchAll=false --runInBand src/app/App.test.tsx src/app/router/AppRouter.test.tsx src/app/App.integration.test.tsx
```

Expected: PASS. The new root test and the two existing route tests render the application without recursion.

- [ ] **Step 5: Commit the isolated regression repair**

```powershell
git add src/app/App.tsx src/app/App.test.tsx
git commit -m "fix: render app router from application root"
```

## Task 2: Add the explicit Babel, PostCSS, and webpack build pipeline

**Files:**

- Create: `babel.config.cjs`, `postcss.config.cjs`, `webpack/webpack.common.cjs`, `webpack/webpack.dev.cjs`, `webpack/webpack.prod.cjs`
- Modify: `package.json`, `package-lock.json`, `public/index.html`, `public/manifest.json`
- Test: `npm.cmd run typecheck`, `npm.cmd run build`

**Interfaces:**

- Consumes: `src/index.tsx`, the existing SCSS files, public assets, and package `browserslist`.
- Produces: `npm start`, `npm run build`, and `npm run typecheck` commands that do not invoke CRA; a production `build/` containing injected HTML, CSS, JavaScript, manifest, and robots files.

- [ ] **Step 1: Add direct build dependencies while temporarily retaining CRA for its test runner**

Run one explicit install. Do not remove `react-scripts` yet; Task 3 replaces its test command first.

```powershell
npm.cmd install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript babel-loader webpack webpack-cli webpack-dev-server webpack-merge html-webpack-plugin copy-webpack-plugin fork-ts-checker-webpack-plugin style-loader css-loader sass-loader mini-css-extract-plugin css-minimizer-webpack-plugin postcss postcss-loader autoprefixer
npm.cmd install react-router@7.18.3
```

Verify that `package.json` keeps `react-router` and `react-router-dom` on compatible `7.18.3` ranges. Do not add `file-loader`, `url-loader`, `clean-webpack-plugin`, or a JavaScript minifier: webpack Asset Modules, `output.clean`, and webpack's production minimizer replace them.

- [ ] **Step 2: Create the shared Babel and PostCSS configurations**

Create `babel.config.cjs`:

```js
module.exports = {
  presets: [
    ['@babel/preset-env', { bugfixes: true }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
```

Create `postcss.config.cjs`:

```js
module.exports = {
  plugins: [require('autoprefixer')],
};
```

Do not add a Babel `targets` option: `@babel/preset-env` and Autoprefixer must both discover the existing `browserslist` from `package.json`.

- [ ] **Step 3: Create the common webpack configuration and style-rule factory**

Create `webpack/webpack.common.cjs`. It must export `createCommonConfig({ isProduction, sourceMap })` so the dev and production configs select their runtime style loader without conditionals in one large mode file:

```js
const path = require('node:path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const rootDirectory = path.resolve(__dirname, '..');

const createScssRule = ({ test, modules, isProduction, sourceMap }) => ({
  test,
  ...(modules ? {} : { exclude: /\.module\.s[ac]ss$/i }),
  sideEffects: !modules,
  use: [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'css-loader',
      options: {
        sourceMap,
        importLoaders: 2,
        ...(modules
          ? {
              modules: {
                localIdentName: '[name]_[local]__[hash:base64:5]',
                namedExport: false,
              },
            }
          : {}),
      },
    },
    { loader: 'postcss-loader', options: { sourceMap } },
    { loader: 'sass-loader', options: { sourceMap } },
  ],
});

module.exports = ({ isProduction = false, sourceMap = false } = {}) => ({
  entry: path.resolve(rootDirectory, 'src/index.tsx'),
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  output: {
    path: path.resolve(rootDirectory, 'build'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: path.resolve(rootDirectory, 'src'),
        use: 'babel-loader',
      },
      createScssRule({
        test: /\.module\.s[ac]ss$/i,
        modules: true,
        isProduction,
        sourceMap,
      }),
      createScssRule({
        test: /\.s[ac]ss$/i,
        modules: false,
        isProduction,
        sourceMap,
      }),
      {
        test: /\.(bmp|gif|jpe?g|png|svg|webp|avif|ico|woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[contenthash:8][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(rootDirectory, 'public/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(rootDirectory, 'public'),
          to: '.',
          globOptions: { ignore: ['**/index.html'] },
        },
      ],
    }),
    new ForkTsCheckerWebpackPlugin({ async: false }),
  ],
});
```

The loader sequence is deliberate: Sass compiles first, PostCSS prefixes the result, CSS Loader resolves imports/modules, and the runtime loader injects or extracts it. `namedExport: false` is required because every existing CSS Module uses `import styles from './Component.module.scss'`.

- [ ] **Step 4: Add separate development and production configurations**

Create `webpack/webpack.dev.cjs`:

```js
const { merge } = require('webpack-merge');
const createCommonConfig = require('./webpack.common');

module.exports = merge(createCommonConfig({ sourceMap: true }), {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'static/js/bundle.js',
    chunkFilename: 'static/js/[name].chunk.js',
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    static: false,
    historyApiFallback: { disableDotRule: true, index: '/' },
    client: { overlay: { errors: true, warnings: false } },
  },
});
```

Create `webpack/webpack.prod.cjs`:

```js
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { merge } = require('webpack-merge');

const createCommonConfig = require('./webpack.common');

module.exports = merge(
  createCommonConfig({ isProduction: true, sourceMap: true }),
  {
    mode: 'production',
    devtool: 'source-map',
    output: {
      clean: true,
      filename: 'static/js/[name].[contenthash:8].js',
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: { chunks: 'all' },
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  }
);
```

- [ ] **Step 5: Switch only build-related scripts and clean CRA public markup**

In `package.json`, make these temporary script values while leaving the existing CRA test script until Task 3:

```json
{
  "scripts": {
    "start": "webpack serve --config webpack/webpack.dev.cjs",
    "build": "webpack --config webpack/webpack.prod.cjs",
    "typecheck": "tsc --noEmit"
  }
}
```

Update `public/index.html` so it remains an HtmlWebpackPlugin template with `<div id="root"></div>`, Russian metadata/title, and a literal `<link rel="manifest" href="/manifest.json" />`. Remove every `%PUBLIC_URL%` token and CRA explanatory comment. Remove the entire `icons` array from `public/manifest.json`, because `favicon.ico`, `logo192.png`, and `logo512.png` do not exist in `public/`.

- [ ] **Step 6: Run compilation checks and inspect build artifacts**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run build
Get-ChildItem -Recurse -File build | Select-Object -ExpandProperty FullName
```

Expected: type checking and webpack production build exit 0; `build/index.html`, `build/manifest.json`, `build/robots.txt`, at least one `build/static/js/*.js`, and at least one `build/static/css/*.css` exist. `build/index.html` contains no `%PUBLIC_URL%` token.

- [ ] **Step 7: Commit the explicit build pipeline**

```powershell
git add package.json package-lock.json babel.config.cjs postcss.config.cjs webpack public/index.html public/manifest.json
git commit -m "build: add explicit webpack pipeline"
```

## Task 3: Replace CRA's hidden Jest setup with direct Jest ownership

**Files:**

- Create: `jest.config.cjs`, `test/styleMock.cjs`, `test/fileMock.cjs`
- Modify: `package.json`, `package-lock.json`
- Test: all existing `src/**/*.test.ts(x)` files and `src/app/App.test.tsx`

**Interfaces:**

- Consumes: `babel.config.cjs`, `src/setupTests.ts`, CSS Module default imports, and existing test filenames.
- Produces: deterministic direct `npm test` and interactive `npm run test:watch` commands independent of `react-scripts`.

- [ ] **Step 1: Add the direct Jest runtime and CSS identity mock**

Run:

```powershell
npm.cmd install --save-dev jest@30 babel-jest@30 jest-environment-jsdom@30 identity-obj-proxy
```

Keep `@types/jest` on its existing v30 range so types and runtime remain aligned.

- [ ] **Step 2: Create the Jest config and two explicit test mocks**

Create `jest.config.cjs`:

```js
module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/test/styleMock.cjs',
    '^.+\\.(bmp|gif|jpe?g|png|svg|webp|avif|ico|woff2?|eot|ttf|otf)$':
      '<rootDir>/test/fileMock.cjs',
  },
  resetMocks: true,
};
```

Create `test/styleMock.cjs`:

```js
module.exports = {};
```

Create `test/fileMock.cjs`:

```js
module.exports = 'test-file-stub';
```

`identity-obj-proxy` is non-negotiable: `TransactionForm.test.tsx` and `Dialog.test.tsx` assert CSS Module properties such as `styles.selected` and `styles.closeButton`. Do not map every style to `{}`.

- [ ] **Step 3: Change test scripts to direct Jest**

Replace the temporary CRA test command in `package.json` with:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch"
  }
}
```

Do not add CRA's `--watchAll` flags; they are not Jest CLI options.

- [ ] **Step 4: Verify CSS Modules, Node-built-in tests, and the full suite**

Run:

```powershell
npm.cmd test -- src/features/add-transaction/ui/TransactionForm.test.tsx src/shared/ui/Dialog/Dialog.test.tsx
npm.cmd test
```

Expected: both CSS-sensitive suites pass, including `Dialog.test.tsx` reading its SCSS source through `__dirname`; the full direct Jest run passes all pre-existing 100 tests plus the Task 1 root-render test (101 total).

- [ ] **Step 5: Commit the direct test runner migration**

```powershell
git add package.json package-lock.json jest.config.cjs test
git commit -m "test: configure Jest without react-scripts"
```

## Task 4: Own the ESLint configuration and remove CRA completely

**Files:**

- Create: `.eslintrc.cjs`
- Modify: `package.json`, `package-lock.json`
- Test: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`

**Interfaces:**

- Consumes: application TypeScript/React files, Jest test files, and CommonJS config/mocks.
- Produces: direct lint rules and a package manifest with no remaining CRA dependencies, scripts, or configuration.

- [ ] **Step 1: Install direct ESLint plugins and move test/build-only packages to development dependencies**

Run:

```powershell
npm.cmd install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-jest eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks @testing-library/dom @testing-library/jest-dom @testing-library/react @testing-library/user-event sass
```

This moves the four Testing Library packages and `sass` out of `dependencies`. Keep React, React DOM, Redux, and both React Router packages as runtime dependencies.

- [ ] **Step 2: Create the project-owned ESLint 8 config**

Create `.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['build', 'coverage', 'node_modules'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['**/*.{test,spec}.{ts,tsx}', 'src/setupTests.ts'],
      env: { jest: true, node: true },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
    {
      files: ['*.cjs', 'webpack/**/*.cjs', 'test/**/*.cjs'],
      env: { node: true },
      parserOptions: { sourceType: 'script' },
    },
  ],
};
```

Do not set `parserOptions.project`: the established `tsconfig.json` intentionally excludes tests, and the migration must not silently expand TypeScript checking scope.

- [ ] **Step 3: Remove CRA dependencies/configuration and finalize scripts**

Run:

```powershell
npm.cmd uninstall react-scripts web-vitals
```

Then edit `package.json` so it has no `eject` script and no `eslintConfig` property. Set the lint script to lint source, Jest tests, mocks, and the new CJS configs:

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx,.cjs",
    "start": "webpack serve --config webpack/webpack.dev.cjs",
    "build": "webpack --config webpack/webpack.prod.cjs",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand",
    "test:watch": "jest --watch"
  }
}
```

Keep the existing `format` and `format:check` scripts and the `browserslist` section exactly intact.

- [ ] **Step 4: Prove there is no CRA behavior left**

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
rg -n "react-scripts|react-app|%PUBLIC_URL%" package.json package-lock.json public webpack .eslintrc.cjs
```

Expected: all four commands exit 0, and `rg` prints no matches. The zero-match `rg` result exits with code 1; treat that specific exit code as the expected proof rather than an error.

- [ ] **Step 5: Commit full CRA removal**

```powershell
git add .eslintrc.cjs package.json package-lock.json
git commit -m "chore: remove create react app tooling"
```

## Task 5: Document and verify the direct-toolchain contract from a clean install

**Files:**

- Modify: `README.md`
- Test: clean install, lint, typecheck, Jest, production build, and local development deep link

**Interfaces:**

- Consumes: completed direct npm scripts and webpack dev/prod outputs.
- Produces: documented setup instructions and evidence that no transitive CRA dependency is masking a missing direct dependency.

- [ ] **Step 1: Document the developer and deployment contract**

Replace the minimal README text with a concise project section and these exact commands:

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

Document that `npm start` serves the app at `http://localhost:3000`, webpack handles deep links locally, `npm run build` emits `build/`, and a production host must rewrite client routes such as `/goals/example` to `/index.html`.

- [ ] **Step 2: Validate the lockfile from a clean dependency tree**

From the isolated migration worktree, run:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run format:check
npm.cmd run build
```

Expected: every command exits 0 after `npm.cmd ci`, demonstrating all tools required by webpack, Jest, PostCSS, and ESLint are direct dependencies in the lockfile.

- [ ] **Step 3: Smoke-test the webpack development server and SPA fallback**

Start the direct server:

```powershell
npm.cmd start
```

Use the local browser at `http://localhost:3000/` and then navigate directly to `http://localhost:3000/goals/example`. Confirm all of the following:

1. The overview screen renders rather than throwing an error or recursively mounting `App`.
2. The direct deep link responds with the SPA shell, and the React router displays its existing missing-goal state instead of an HTTP 404.
3. Browser developer logs contain no compilation errors.
4. `http://localhost:3000/manifest.json` and `http://localhost:3000/robots.txt` are reachable.

Stop the dev server after the smoke test. Do not treat webpack's dev-server fallback as a production-host rewrite; the README requirement remains necessary.

- [ ] **Step 4: Review the migration diff and commit documentation/verification changes**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and only intended migration files changed. Then commit the README:

```powershell
git add README.md
git commit -m "docs: document webpack development workflow"
```

If a verification step made no tracked change, do not create an empty commit.

## Plan Self-Review

### Spec coverage

| Specification requirement                                                                             | Implementing task |
| ----------------------------------------------------------------------------------------------------- | ----------------- |
| Completely remove `react-scripts`, `eject`, CRA ESLint inheritance, and unused `web-vitals`           | Task 4            |
| Separate common, development, and production webpack configs                                          | Task 2            |
| TS/TSX, global SCSS, CSS Modules, browser targets, assets, public files, and hashed production output | Task 2            |
| HMR and deep-link fallback locally; deployment fallback documentation                                 | Tasks 2 and 5     |
| Direct Jest with jsdom, setup file, CSS identity mock, and aligned v30 runtime                        | Task 3            |
| Direct TypeScript checks and ESLint configuration                                                     | Tasks 2 and 4     |
| Preserve runtime route imports and package dependency hygiene                                         | Task 2 and Task 4 |
| Preserve application behavior during browser verification                                             | Task 1 and Task 5 |
| README commands and clean-install verification                                                        | Task 5            |

### Placeholder scan

The plan contains no deferred work markers. Every generated config, loader order, package command, script, mock, runtime behavior, and verification command is specified directly.

### Type and configuration consistency

All configurations use `src/index.tsx` as the sole entry point, `build/` as the output directory, root `publicPath: '/'`, `babel.config.cjs` as the source/test transform, and `browserslist` as the browser-target source. CSS Modules consistently use default exports in webpack and `identity-obj-proxy` in Jest. The direct test suite is expected to grow from 100 to 101 tests solely because Task 1 adds the application-root regression test.
