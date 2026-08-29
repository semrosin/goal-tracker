import type { UnknownAction } from '@reduxjs/toolkit';

import { goalsActions, goalsReducer } from '../../entities/goal/model/goalSlice';
import type { Goal } from '../../entities/goal/model/types';
import { calculateBalance } from '../../entities/transaction/model/selectors';
import { transactionsActions, transactionsReducer } from '../../entities/transaction/model/transactionSlice';
import type { Transaction } from '../../entities/transaction/model/types';
import { isPositiveInteger } from '../../shared/lib/validation';

export type RootState = {
  goals: Goal[];
  transactions: Transaction[];
};

export const rootInitialState: RootState = { goals: [], transactions: [] };

export const rootReducer = (state: RootState = rootInitialState, action: UnknownAction): RootState => {
  if (transactionsActions.transactionCreated.match(action)) {
    const transaction = action.payload;
    const goalExists = state.goals.some((goal) => goal.id === transaction.goalId);
    const balance = calculateBalance(transaction.goalId, state.transactions);

    if (!goalExists || !isPositiveInteger(transaction.amount)) return state;
    if (transaction.type === 'withdrawal' && transaction.amount > balance) return state;
  }

  const goals = goalsReducer(state.goals, action);
  const transactions = goalsActions.goalRemoved.match(action)
    ? transactionsReducer(state.transactions, transactionsActions.transactionsRemovedForGoal(action.payload))
    : transactionsReducer(state.transactions, action);

  if (goals === state.goals && transactions === state.transactions) return state;

  return { goals, transactions };
};
