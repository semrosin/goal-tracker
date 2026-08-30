import type { Goal } from '../../entities/goal/model/types';
import { calculateBalance } from '../../entities/transaction/model/selectors';
import type {
  Transaction,
  TransactionType,
} from '../../entities/transaction/model/types';
import { isPositiveInteger } from '../../shared/lib/validation';
import { readJson, writeJson } from '../../shared/lib/storage/safeStorage';
import type { RootState } from './rootReducer';

export const STORAGE_KEY = 'goal-tracker-state';

const isIsoString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

const isTransactionType = (value: unknown): value is TransactionType =>
  value === 'deposit' || value === 'withdrawal';

const isGoal = (value: unknown): value is Goal => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.targetAmount === 'number' &&
    isPositiveInteger(candidate.targetAmount) &&
    isIsoString(candidate.createdAt)
  );
};

const isTransaction = (value: unknown): value is Transaction => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.goalId === 'string' &&
    candidate.goalId.length > 0 &&
    isTransactionType(candidate.type) &&
    typeof candidate.amount === 'number' &&
    isPositiveInteger(candidate.amount) &&
    isIsoString(candidate.createdAt)
  );
};

const isValidState = (value: unknown): value is RootState => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.goals) || !Array.isArray(candidate.transactions))
    return false;
  const goals = candidate.goals as Goal[];
  const transactions = candidate.transactions as Transaction[];
  if (!goals.every(isGoal) || !transactions.every(isTransaction)) return false;

  return transactions.every((transaction, index) => {
    const goalExists = goals.some((goal) => goal.id === transaction.goalId);
    const priorTransactions = transactions.slice(0, index) as Transaction[];
    const balance = calculateBalance(transaction.goalId, priorTransactions);
    return (
      goalExists &&
      (transaction.type === 'deposit' || transaction.amount <= balance)
    );
  });
};

export const loadPersistedState = (): RootState | undefined => {
  const persistedState = readJson(STORAGE_KEY, isValidState);
  if (persistedState === null) return undefined;

  return {
    goals: persistedState.goals,
    transactions: persistedState.transactions,
  };
};

export const savePersistedState = (state: RootState): void => {
  writeJson(STORAGE_KEY, {
    goals: state.goals,
    transactions: state.transactions,
  });
};
