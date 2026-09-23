import { goalsActions } from '../../entities/goal/model/goalSlice';
import type { Goal } from '../../entities/goal/model/types';
import { transactionsActions } from '../../entities/transaction/model/transactionSlice';
import type { Transaction } from '../../entities/transaction/model/types';
import { STORAGE_KEY } from './persistence';
import { createAppStore, createDemoStore } from './store';
import { DEMO_STORAGE_KEY } from './persistence';
import { ledgerReplaced } from './rootReducer';

const goal: Goal = {
  id: 'g1',
  title: 'Vacation',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const validLedger: Transaction[] = [
  {
    id: 'd1',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'w1',
    goalId: 'g1',
    type: 'withdrawal',
    amount: 100,
    createdAt: '2026-01-01T00:01:00.000Z',
  },
  {
    id: 'd2',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:02:00.000Z',
  },
];

afterEach(() => {
  window.localStorage.clear();
});

test('reloads the original ordered ledger after dispatch persistence', () => {
  const sourceStore = createAppStore();

  sourceStore.dispatch(goalsActions.goalCreated(goal));
  validLedger.forEach((transaction) => {
    sourceStore.dispatch(transactionsActions.transactionCreated(transaction));
  });

  const reloadedStore = createAppStore();

  expect(reloadedStore.getState()).toEqual({
    goals: [goal],
    transactions: validLedger,
  });
});

test('falls back to an empty ledger for an invalid explicit preload', () => {
  const store = createAppStore({
    goals: [goal],
    transactions: [
      {
        id: 'w1',
        goalId: 'g1',
        type: 'withdrawal',
        amount: 100,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ],
  });

  expect(store.getState()).toEqual({ goals: [], transactions: [] });
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
});

test('falls back to an empty ledger when a persisted balance prefix overflows', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      goals: [goal],
      transactions: [
        {
          id: 'maximum-safe-deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: Number.MAX_SAFE_INTEGER,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'overflowing-deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: 1,
          createdAt: '2026-01-01T00:01:00.000Z',
        },
      ],
    })
  );

  expect(createAppStore().getState()).toEqual({ goals: [], transactions: [] });
});

test('persists and reloads the original ledger after a rejected historical deletion', () => {
  const originalLedger: Transaction[] = [
    {
      id: 'd1',
      goalId: 'g1',
      type: 'deposit',
      amount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'w1',
      goalId: 'g1',
      type: 'withdrawal',
      amount: 100,
      createdAt: '2026-01-01T00:01:00.000Z',
    },
    {
      id: 'd2',
      goalId: 'g1',
      type: 'deposit',
      amount: 100,
      createdAt: '2026-01-01T00:02:00.000Z',
    },
  ];
  const sourceStore = createAppStore({
    goals: [goal],
    transactions: originalLedger,
  });

  sourceStore.dispatch(transactionsActions.transactionRemoved('d1'));

  expect(sourceStore.getState().transactions).toEqual(originalLedger);
  expect(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  ).toEqual({
    goals: [goal],
    transactions: originalLedger,
  });
  expect(createAppStore().getState()).toEqual({
    goals: [goal],
    transactions: originalLedger,
  });
});

test('cloud store never reads or writes the local ledger', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      goals: [goal],
      transactions: [],
    })
  );

  const cloudStore = createAppStore(undefined, { persist: false });
  expect(cloudStore.getState()).toEqual({ goals: [], transactions: [] });
  cloudStore.dispatch(goalsActions.goalCreated({ ...goal, id: 'cloud' }));
  expect(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  ).toEqual({
    goals: [goal],
    transactions: [],
  });
});

test('demo starts from existing legacy goals without rewriting them', () => {
  const legacyState = { goals: [goal], transactions: [] };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState));

  const demoStore = createDemoStore();
  expect(demoStore.getState()).toEqual(legacyState);
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
    JSON.stringify(legacyState)
  );
  expect(
    JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? 'null')
  ).toEqual(legacyState);
});

test('demo seeds examples only when neither local store has data', () => {
  const demoStore = createDemoStore();
  expect(demoStore.getState().goals.length).toBeGreaterThan(0);
  expect(demoStore.getState().transactions.length).toBeGreaterThan(0);
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(
    JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? 'null')
  ).toEqual(demoStore.getState());
});

test('a fresh English demo starts with English example goals', () => {
  const demoStore = createDemoStore('en');
  expect(demoStore.getState().goals[0].title).toBe('Emergency fund');
  expect(demoStore.getState().goals[0].targetMonth).toMatch(/^\d{4}-\d{2}$/);
});

test('replaces cloud snapshot after a server fetch without persisting it', () => {
  const cloudStore = createAppStore(undefined, { persist: false });
  cloudStore.dispatch(ledgerReplaced({ goals: [goal], transactions: [] }));

  expect(cloudStore.getState()).toEqual({ goals: [goal], transactions: [] });
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(window.localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();

  cloudStore.dispatch(ledgerReplaced({ goals: [], transactions: [] }));
  expect(cloudStore.getState()).toEqual({ goals: [], transactions: [] });
});
