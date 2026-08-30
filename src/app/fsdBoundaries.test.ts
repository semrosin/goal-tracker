import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, extname, join, relative, resolve, sep } from 'path';
import ts from 'typescript';

type FsdLayer =
  'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared';

const sourceRoot = resolve(process.cwd(), 'src');
const sourceExtensions = ['.ts', '.tsx'];
const layerRanks: Record<FsdLayer, number> = {
  app: 5,
  pages: 4,
  widgets: 3,
  features: 2,
  entities: 1,
  shared: 0,
};

const isSourceFile = (filePath: string) =>
  sourceExtensions.includes(extname(filePath));

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry);
    return statSync(entryPath).isDirectory()
      ? collectSourceFiles(entryPath)
      : isSourceFile(entryPath)
        ? [entryPath]
        : [];
  });

const getLayer = (filePath: string): FsdLayer | undefined => {
  const [layer] = relative(sourceRoot, filePath).split(sep);
  return layer in layerRanks ? (layer as FsdLayer) : undefined;
};

const resolveRelativeImport = (
  sourceFile: string,
  specifier: string
): string | undefined => {
  if (!specifier.startsWith('.')) return undefined;

  const basePath = resolve(dirname(sourceFile), specifier);
  const candidates = [
    basePath,
    ...sourceExtensions.map((extension) => `${basePath}${extension}`),
    ...sourceExtensions.map((extension) => join(basePath, `index${extension}`)),
  ];

  return candidates.find(
    (candidate) =>
      isSourceFile(candidate) &&
      existsSync(candidate) &&
      !relative(sourceRoot, candidate).startsWith('..')
  );
};

const getRelativeImports = (sourceFile: string): string[] => {
  const parsed = ts.createSourceFile(
    sourceFile,
    readFileSync(sourceFile, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const imports: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(parsed);
  return imports;
};

test('rejects relative imports from a lower FSD layer to a higher one', () => {
  const violations = collectSourceFiles(sourceRoot).flatMap((sourceFile) => {
    const sourceLayer = getLayer(sourceFile);
    if (sourceLayer === undefined) return [];

    return getRelativeImports(sourceFile).flatMap((specifier) => {
      const targetFile = resolveRelativeImport(sourceFile, specifier);
      const targetLayer =
        targetFile === undefined ? undefined : getLayer(targetFile);

      return targetLayer !== undefined &&
        layerRanks[targetLayer] > layerRanks[sourceLayer]
        ? [
            `${relative(sourceRoot, sourceFile)} -> ${relative(sourceRoot, targetFile)}`,
          ]
        : [];
    });
  });

  expect(violations).toEqual([]);
});
