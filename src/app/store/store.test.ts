import { goalsActions } from '../../entities/goal/model/goalSlice';
import type { Goal } from '../../entities/goal/model/types';
import { transactionsActions } from '../../entities/transaction/model/transactionSlice';
import type { Transaction } from '../../entities/transaction/model/types';
import { STORAGE_KEY } from './persistence';
import { createAppStore } from './store';

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
