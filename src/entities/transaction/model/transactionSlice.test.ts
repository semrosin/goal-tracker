import { rootReducer, type RootState } from '../../../app/store/rootReducer';
import { calculateBalance } from './selectors';
import { transactionsActions } from './transactionSlice';
import type { Transaction } from './types';
import type { Goal } from '../../goal/model/types';

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

const withdrawal = (amount: number): Transaction => ({
  id: `withdrawal-${amount}`,
  goalId: 'g1',
  type: 'withdrawal',
  amount,
  createdAt: '2026-01-03T00:00:00.000Z',
});

test('derives a balance from the transaction ledger', () => {
  expect(calculateBalance('g1', [deposit(800), withdrawal(300)])).toBe(500);
});

test('does not add a withdrawal larger than the current balance', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(500)] };

  const next = rootReducer(state, transactionsActions.transactionCreated(withdrawal(600)));

  expect(next.transactions).toHaveLength(1);
});

test.each([0, -1, 1.5])('does not add a transaction with invalid amount %p', (amount) => {
  const state: RootState = { goals: [goal], transactions: [] };

  const next = rootReducer(state, transactionsActions.transactionCreated(deposit(amount)));

  expect(next.transactions).toEqual([]);
});

test('does not add a transaction for a missing goal', () => {
  const next = rootReducer(undefined, transactionsActions.transactionCreated(deposit(100)));

  expect(next.transactions).toEqual([]);
});

test('adds a valid withdrawal equal to the balance', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(500)] };

  const next = rootReducer(state, transactionsActions.transactionCreated(withdrawal(500)));

  expect(next.transactions).toEqual([deposit(500), withdrawal(500)]);
});

test('removes a transaction by id', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(100)] };

  const next = rootReducer(state, transactionsActions.transactionRemoved('deposit-100'));

  expect(next.transactions).toEqual([]);
});

test('does not remove a deposit when it would leave a withdrawal without funds', () => {
  const state: RootState = { goals: [goal], transactions: [deposit(100), withdrawal(100)] };

  const next = rootReducer(state, transactionsActions.transactionRemoved('deposit-100'));

  expect(next.transactions).toEqual([deposit(100), withdrawal(100)]);
});

test('rejects a forged transaction creation with an invalid type', () => {
  const forgedAction = {
    type: transactionsActions.transactionCreated.type,
    payload: { ...deposit(1), type: 'invalid' },
  };

  const next = rootReducer({ goals: [goal], transactions: [] }, forgedAction);

  expect(next.transactions).toEqual([]);
});

test('rejects a transaction creation action without a payload', () => {
  const next = rootReducer({ goals: [goal], transactions: [] }, { type: transactionsActions.transactionCreated.type });

  expect(next.transactions).toEqual([]);
});
