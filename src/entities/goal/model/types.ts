import type { Currency } from '../../../shared/lib/money';

export type Goal = {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currency?: Currency;
  targetMonth?: string;
  createdAt: string;
};

export type GoalUpdate = Pick<
  Goal,
  'id' | 'title' | 'targetAmount' | 'description' | 'targetMonth' | 'currency'
>;
