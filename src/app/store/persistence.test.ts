import {
  loadPersistedState,
  savePersistedState,
  STORAGE_KEY,
} from './persistence';
import type { RootState } from './rootReducer';

const validState: RootState = {
  goals: [
    {
      id: 'g1',
      title: 'Отпуск',
      targetAmount: 1_000,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: 't1',
      goalId: 'g1',
      type: 'deposit',
      amount: 500,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ],
};

afterEach(() => {
  window.localStorage.clear();
});

test('loads a fully valid persisted snapshot', () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validState));

  expect(loadPersistedState()).toEqual(validState);
});

test('falls back to empty state when persisted transaction data is invalid', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ goals: [], transactions: [{ amount: 1.5 }] })
  );

  expect(loadPersistedState()).toBeUndefined();
});

test('rejects the entire snapshot when a goal is malformed', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...validState,
      goals: [{ ...validState.goals[0], createdAt: 'not-a-date' }],
    })
  );

  expect(loadPersistedState()).toBeUndefined();
});

test('persists the complete normalized state', () => {
  savePersistedState(validState);

  expect(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  ).toEqual(validState);
});

test('normalizes a persisted snapshot that contains a forbidden saved amount', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...validState,
      goals: [{ ...validState.goals[0], savedAmount: 500 }],
      transactions: [{ ...validState.transactions[0], source: 'migration' }],
    })
  );

  expect(loadPersistedState()).toEqual(validState);
});

test('rejects a persisted ledger that becomes negative before a later deposit', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      goals: validState.goals,
      transactions: [
        {
          id: 'w1',
          goalId: 'g1',
          type: 'withdrawal',
          amount: 100,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'd2',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-02T00:01:00.000Z',
        },
      ],
    })
  );

  expect(loadPersistedState()).toBeUndefined();
});

test.each([
  {
    goals: [validState.goals[0], validState.goals[0]],
    transactions: validState.transactions,
    kind: 'goal',
  },
  {
    goals: validState.goals,
    transactions: [validState.transactions[0], validState.transactions[0]],
    kind: 'transaction',
  },
])(
  'rejects a persisted snapshot with duplicate $kind IDs',
  ({ goals, transactions }) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ goals, transactions })
    );

    expect(loadPersistedState()).toBeUndefined();
  }
);

test('serializes only canonical entity fields from a polluted state', () => {
  savePersistedState({
    goals: [{ ...validState.goals[0], savedAmount: 500 }],
    transactions: [{ ...validState.transactions[0], source: 'migration' }],
  } as RootState);

  expect(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  ).toEqual(validState);
});
