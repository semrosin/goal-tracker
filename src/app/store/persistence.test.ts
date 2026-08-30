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
    JSON.stringify({ ...validState, savedAmount: 500 })
  );

  expect(loadPersistedState()).toEqual(validState);
});

test('serializes only goals and transactions when passed an object with extra properties', () => {
  savePersistedState({ ...validState, savedAmount: 500 } as RootState);

  expect(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  ).toEqual(validState);
});
