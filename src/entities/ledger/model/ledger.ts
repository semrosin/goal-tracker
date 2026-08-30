import type { UnknownAction } from '@reduxjs/toolkit';

import { goalsActions, goalsReducer } from '../../goal/model/goalSlice';
import type { Goal, GoalUpdate } from '../../goal/model/types';
import {
  transactionsActions,
  transactionsReducer,
} from '../../transaction/model/transactionSlice';
import type { Transaction } from '../../transaction/model/types';
import { isPositiveInteger } from '../../../shared/lib/validation';

export type LedgerState = {
  goals: Goal[];
  transactions: Transaction[];
};

export const ledgerInitialState: LedgerState = { goals: [], transactions: [] };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isIsoString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

const decodeGoal = (value: unknown): Goal | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const candidate = value as Record<string, unknown>;
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.title) ||
    typeof candidate.targetAmount !== 'number' ||
    !isPositiveInteger(candidate.targetAmount) ||
    !isIsoString(candidate.createdAt)
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    targetAmount: candidate.targetAmount,
    createdAt: candidate.createdAt,
  };
};

const decodeGoalUpdate = (value: unknown): GoalUpdate | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const candidate = value as Record<string, unknown>;
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.title) ||
    typeof candidate.targetAmount !== 'number' ||
    !isPositiveInteger(candidate.targetAmount)
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    targetAmount: candidate.targetAmount,
  };
};

const decodeTransaction = (value: unknown): Transaction | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const candidate = value as Record<string, unknown>;
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.goalId) ||
    (candidate.type !== 'deposit' && candidate.type !== 'withdrawal') ||
    typeof candidate.amount !== 'number' ||
    !isPositiveInteger(candidate.amount) ||
    !isIsoString(candidate.createdAt)
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    goalId: candidate.goalId,
    type: candidate.type,
    amount: candidate.amount,
    createdAt: candidate.createdAt,
  };
};

export const hasNonNegativeBalancePrefixes = (
  transactions: readonly Transaction[]
): boolean => {
  const balances = new Map<string, number>();

  for (const transaction of transactions) {
    const previous = balances.get(transaction.goalId) ?? 0;
    const next =
      previous +
      (transaction.type === 'deposit'
        ? transaction.amount
        : -transaction.amount);

    if (next < 0) return false;

    balances.set(transaction.goalId, next);
  }

  return true;
};

export const decodeLedgerState = (value: unknown): LedgerState | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.goals) || !Array.isArray(candidate.transactions))
    return undefined;

  const goals: Goal[] = [];
  for (const value of candidate.goals) {
    const goal = decodeGoal(value);
    if (goal === undefined) return undefined;
    goals.push(goal);
  }

  const transactions: Transaction[] = [];
  for (const value of candidate.transactions) {
    const transaction = decodeTransaction(value);
    if (transaction === undefined) return undefined;
    transactions.push(transaction);
  }

  const goalIds = new Set(goals.map((goal) => goal.id));
  if (goalIds.size !== goals.length) return undefined;

  const transactionIds = new Set(
    transactions.map((transaction) => transaction.id)
  );
  if (transactionIds.size !== transactions.length) return undefined;

  if (transactions.some((transaction) => !goalIds.has(transaction.goalId)))
    return undefined;

  if (!hasNonNegativeBalancePrefixes(transactions)) return undefined;

  return { goals, transactions };
};

export const serializeLedgerState = (state: LedgerState): LedgerState => ({
  goals: state.goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    createdAt: goal.createdAt,
  })),
  transactions: state.transactions.map((transaction) => ({
    id: transaction.id,
    goalId: transaction.goalId,
    type: transaction.type,
    amount: transaction.amount,
    createdAt: transaction.createdAt,
  })),
});

export const ledgerReducer = (
  state: LedgerState = ledgerInitialState,
  action: UnknownAction
): LedgerState => {
  let canonicalAction = action;
  let removedGoalId: string | undefined;

  if (goalsActions.goalCreated.match(action)) {
    const goal = decodeGoal(action.payload);
    if (goal === undefined || state.goals.some((item) => item.id === goal.id))
      return state;

    canonicalAction = goalsActions.goalCreated(goal);
  }

  if (goalsActions.goalUpdated.match(action)) {
    const goal = decodeGoalUpdate(action.payload);
    if (
      goal === undefined ||
      !state.goals.some((item) => item.id === goal.id)
    ) {
      return state;
    }

    canonicalAction = goalsActions.goalUpdated(goal);
  }

  if (goalsActions.goalRemoved.match(action)) {
    if (!isNonEmptyString(action.payload)) return state;

    removedGoalId = action.payload;
    canonicalAction = goalsActions.goalRemoved(removedGoalId);
  }

  if (transactionsActions.transactionCreated.match(action)) {
    const transaction = decodeTransaction(action.payload);
    if (
      transaction === undefined ||
      state.transactions.some((item) => item.id === transaction.id) ||
      !state.goals.some((goal) => goal.id === transaction.goalId) ||
      !hasNonNegativeBalancePrefixes([...state.transactions, transaction])
    ) {
      return state;
    }

    canonicalAction = transactionsActions.transactionCreated(transaction);
  }

  if (transactionsActions.transactionRemoved.match(action)) {
    if (!isNonEmptyString(action.payload)) return state;

    const remainingTransactions = state.transactions.filter(
      (transaction) => transaction.id !== action.payload
    );
    if (remainingTransactions.length === state.transactions.length)
      return state;
    if (!hasNonNegativeBalancePrefixes(remainingTransactions)) return state;

    canonicalAction = transactionsActions.transactionRemoved(action.payload);
  }

  const goals = goalsReducer(state.goals, canonicalAction);
  const transactions =
    removedGoalId === undefined
      ? transactionsReducer(state.transactions, canonicalAction)
      : transactionsReducer(
          state.transactions,
          transactionsActions.transactionsRemovedForGoal(removedGoalId)
        );

  if (goals === state.goals && transactions === state.transactions)
    return state;

  return { goals, transactions };
};
