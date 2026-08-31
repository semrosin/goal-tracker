import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, extname, join, relative, resolve, sep } from 'path';
import ts from 'typescript';

type FsdLayer =
  'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared';

type FsdSlice = {
  layer: FsdLayer;
  name: string;
  directory: string;
};

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

const getSlice = (filePath: string): FsdSlice | undefined => {
  const [layer, name] = relative(sourceRoot, filePath).split(sep);
  if (!(layer in layerRanks) || name === undefined) return undefined;

  return {
    layer: layer as FsdLayer,
    name,
    directory: join(sourceRoot, layer, name),
  };
};

const isTestFile = (filePath: string): boolean =>
  /\.(test|spec)\.tsx?$/.test(filePath);

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

const isCrossSlicePublicApiViolation = (
  sourceFile: string,
  targetFile: string
): boolean => {
  const sourceSlice = getSlice(sourceFile);
  const targetSlice = getSlice(targetFile);
  if (sourceSlice === undefined || targetSlice === undefined) return false;

  if (
    sourceSlice.layer === targetSlice.layer &&
    sourceSlice.name === targetSlice.name
  ) {
    return false;
  }

  if (targetSlice.layer === 'shared') return false;

  const [targetSegment] = relative(targetSlice.directory, targetFile).split(
    sep
  );
  if (targetSegment !== 'ui' && targetSegment !== 'model') return false;

  return existsSync(join(targetSlice.directory, 'index.ts'));
};

const findRuntimePublicApiViolations = () =>
  collectSourceFiles(sourceRoot).flatMap((sourceFile) => {
    if (isTestFile(sourceFile)) return [];

    return getRelativeImports(sourceFile).flatMap((specifier) => {
      const targetFile = resolveRelativeImport(sourceFile, specifier);
      return targetFile !== undefined &&
        isCrossSlicePublicApiViolation(sourceFile, targetFile)
        ? [
            `${relative(sourceRoot, sourceFile)} -> ${relative(
              sourceRoot,
              targetFile
            )}`,
          ]
        : [];
    });
  });

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

test('rejects runtime cross-slice imports of public slice internals', () => {
  expect(findRuntimePublicApiViolations()).toEqual([]);
});

test('recognizes only cross-slice model and ui internals with a public facade', () => {
  const storeFile = join(sourceRoot, 'app', 'store', 'store.ts');
  const ledgerModel = resolveRelativeImport(
    storeFile,
    '../../entities/ledger/model/ledger'
  );
  const ledgerFacade = resolveRelativeImport(
    storeFile,
    '../../entities/ledger'
  );
  const sharedUi = resolveRelativeImport(
    join(sourceRoot, 'widgets', 'goals-list', 'ui', 'GoalsList.tsx'),
    '../../../shared/ui/ProgressBar/ProgressBar'
  );
  const ledgerTesting = resolveRelativeImport(
    join(sourceRoot, 'app', 'test', 'renderWithStore.tsx'),
    '../../entities/ledger/testing/renderWithLedger'
  );

  expect(ledgerModel).toBeDefined();
  expect(ledgerFacade).toBeDefined();
  expect(sharedUi).toBeDefined();
  expect(ledgerTesting).toBeDefined();
  expect(isCrossSlicePublicApiViolation(storeFile, ledgerModel as string)).toBe(
    true
  );
  expect(
    isCrossSlicePublicApiViolation(storeFile, ledgerFacade as string)
  ).toBe(false);
  expect(
    isCrossSlicePublicApiViolation(
      join(sourceRoot, 'widgets', 'goals-list', 'ui', 'GoalsList.tsx'),
      sharedUi as string
    )
  ).toBe(false);
  expect(
    isCrossSlicePublicApiViolation(
      join(sourceRoot, 'app', 'test', 'renderWithStore.tsx'),
      ledgerTesting as string
    )
  ).toBe(false);
  expect(isTestFile(join(sourceRoot, 'app', 'fsdBoundaries.test.ts'))).toBe(
    true
  );
  expect(resolveRelativeImport(storeFile, 'react')).toBeUndefined();
});
