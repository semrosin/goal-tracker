import type { UnknownAction } from '@reduxjs/toolkit';

import {
  goalsActions,
  goalsReducer,
} from '../../entities/goal/model/goalSlice';
import type { Goal } from '../../entities/goal/model/types';
import { calculateBalance } from '../../entities/transaction/model/selectors';
import {
  transactionsActions,
  transactionsReducer,
} from '../../entities/transaction/model/transactionSlice';
import type { Transaction } from '../../entities/transaction/model/types';
import { isPositiveInteger } from '../../shared/lib/validation';

export type RootState = {
  goals: Goal[];
  transactions: Transaction[];
};

export const rootInitialState: RootState = { goals: [], transactions: [] };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isIsoString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

const isValidGoal = (value: unknown): value is Goal => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.title) &&
    typeof candidate.targetAmount === 'number' &&
    isPositiveInteger(candidate.targetAmount) &&
    isIsoString(candidate.createdAt)
  );
};

const isValidGoalUpdate = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.title) &&
    typeof candidate.targetAmount === 'number' &&
    isPositiveInteger(candidate.targetAmount)
  );
};

const isValidTransaction = (value: unknown): value is Transaction => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.goalId) &&
    (candidate.type === 'deposit' || candidate.type === 'withdrawal') &&
    typeof candidate.amount === 'number' &&
    isPositiveInteger(candidate.amount) &&
    isIsoString(candidate.createdAt)
  );
};

export const rootReducer = (
  state: RootState = rootInitialState,
  action: UnknownAction
): RootState => {
  if (goalsActions.goalCreated.match(action)) {
    const goal = action.payload;
    if (!isValidGoal(goal) || state.goals.some((item) => item.id === goal.id))
      return state;
  }

  if (goalsActions.goalUpdated.match(action)) {
    const goal = action.payload;
    if (
      !isValidGoalUpdate(goal) ||
      !state.goals.some((item) => item.id === goal.id)
    )
      return state;
  }

  if (
    goalsActions.goalRemoved.match(action) &&
    !isNonEmptyString(action.payload)
  )
    return state;

  if (transactionsActions.transactionCreated.match(action)) {
    const transaction = action.payload;
    if (
      !isValidTransaction(transaction) ||
      state.transactions.some((item) => item.id === transaction.id)
    )
      return state;

    const goalExists = state.goals.some(
      (goal) => goal.id === transaction.goalId
    );
    const balance = calculateBalance(transaction.goalId, state.transactions);

    if (!goalExists) return state;
    if (transaction.type === 'withdrawal' && transaction.amount > balance)
      return state;
  }

  if (transactionsActions.transactionRemoved.match(action)) {
    const transactionId = action.payload;
    if (!isNonEmptyString(transactionId)) return state;

    const remainingTransactions = state.transactions.filter(
      (transaction) => transaction.id !== transactionId
    );
    if (remainingTransactions.length === state.transactions.length)
      return state;

    const hasNegativeBalance = state.goals.some(
      (goal) => calculateBalance(goal.id, remainingTransactions) < 0
    );
    if (hasNegativeBalance) return state;
  }

  const goals = goalsReducer(state.goals, action);
  const transactions = goalsActions.goalRemoved.match(action)
    ? transactionsReducer(
        state.transactions,
        transactionsActions.transactionsRemovedForGoal(action.payload)
      )
    : transactionsReducer(state.transactions, action);

  if (goals === state.goals && transactions === state.transactions)
    return state;

  return { goals, transactions };
};
