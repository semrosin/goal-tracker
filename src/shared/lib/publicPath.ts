// Kept in sync with webpack's PUBLIC_PATH. Tests without a deployment
// target fall back to the domain root.
const publicPath = process.env.PUBLIC_PATH ?? '/';

export const publicAsset = (path: string): string =>
  `${publicPath}${path.replace(/^\/+/, '')}`;

export const routerBasename = (): string | undefined => {
  const normalized = publicPath.replace(/\/+$/, '');
  return normalized === '' ? undefined : normalized;
};
