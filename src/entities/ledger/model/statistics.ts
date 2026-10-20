import { calculateProgress } from '../../goal';
import type { Currency } from '../../../shared/lib/money';
import type { LedgerState } from './ledger';

export type MonthlyStatistics = {
  month: string;
  deposits: number;
  withdrawals: number;
  balance: number;
};

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const calculateStatistics = (
  { goals, transactions }: LedgerState,
  currency: Currency,
  now: Date
) => {
  const selectedGoals = goals.filter(
    (goal) => (goal.currency ?? 'RUB') === currency
  );
  const goalIds = new Set(selectedGoals.map((goal) => goal.id));
  const balances = new Map<string, number>();
  const months: MonthlyStatistics[] = Array.from({ length: 6 }, (_, index) => ({
    month: monthKey(new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)),
    deposits: 0,
    withdrawals: 0,
    balance: 0,
  }));
  const byMonth = new Map(months.map((month) => [month.month, month]));
  let deposits = 0;
  let withdrawals = 0;
  let transactionCount = 0;
  let openingBalance = 0;

  for (const transaction of transactions) {
    if (!goalIds.has(transaction.goalId)) continue;
    const delta =
      transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
    balances.set(
      transaction.goalId,
      (balances.get(transaction.goalId) ?? 0) + delta
    );
    transactionCount += 1;
    if (transaction.type === 'deposit') deposits += transaction.amount;
    else withdrawals += transaction.amount;
    const key = monthKey(new Date(transaction.createdAt));
    if (key < months[0].month) openingBalance += delta;
    const month = byMonth.get(key);
    if (month) {
      if (transaction.type === 'deposit') month.deposits += transaction.amount;
      else month.withdrawals += transaction.amount;
    }
  }

  let balance = openingBalance;
  for (const month of months) {
    balance += month.deposits - month.withdrawals;
    month.balance = balance;
  }

  const goalProgress = selectedGoals.map((goal) => {
    const saved = balances.get(goal.id) ?? 0;
    return {
      ...goal,
      balance: saved,
      progress: calculateProgress(saved, goal.targetAmount),
    };
  });
  const completed = goalProgress.filter(
    (goal) => goal.balance >= goal.targetAmount
  ).length;

  return {
    saved: deposits - withdrawals,
    deposits,
    withdrawals,
    transactionCount,
    completed,
    active: selectedGoals.length - completed,
    months,
    goalProgress,
  };
};

export type ProfileStatistics = ReturnType<typeof calculateStatistics>;
