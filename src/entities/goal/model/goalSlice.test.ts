import { rootReducer, type RootState } from '../../../app/store/rootReducer';
import { calculateProgress } from './selectors';
import { goalsActions } from './goalSlice';
import type { Goal } from './types';
import type { Transaction } from '../../transaction/model/types';

const goal: Goal = {
  id: 'g1',
  title: 'Отпуск',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const deposit = (amount: number): Transaction => ({
  id: `deposit-${amount}`,
  goalId: 'g1',
  type: 'deposit',
  amount,
  createdAt: '2026-01-02T00:00:00.000Z',
});

test('clamps progress at 100 percent', () => {
  expect(calculateProgress(1_500, 1_000)).toBe(100);
});

test('removes a goal and all of its transactions', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(100)] };

  const next = rootReducer(state, goalsActions.goalRemoved('g1'));

  expect(next.goals).toEqual([]);
  expect(next.transactions).toEqual([]);
});

test('creates a goal in the entity slice', () => {
  const next = rootReducer(undefined, goalsActions.goalCreated(goal));

  expect(next.goals).toEqual([goal]);
});

test('updates an existing goal without changing its identity', () => {
  const state: RootState = { goals: [goal], transactions: [] };

  const next = rootReducer(state, goalsActions.goalUpdated({ id: 'g1', title: 'Поездка', targetAmount: 2_000 }));

  expect(next.goals).toEqual([{ ...goal, title: 'Поездка', targetAmount: 2_000 }]);
});
