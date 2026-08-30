import type { Transaction } from './types';

export const calculateBalance = (
  goalId: string,
  transactions: Transaction[]
): number =>
  transactions
    .filter((transaction) => transaction.goalId === goalId)
    .reduce(
      (total, transaction) =>
        total +
        (transaction.type === 'deposit'
          ? transaction.amount
          : -transaction.amount),
      0
    );

export const selectTransactionsForGoal = (
  transactions: Transaction[],
  goalId: string
): Transaction[] =>
  transactions.filter((transaction) => transaction.goalId === goalId);
