import type { Goal } from './types';

export const calculateProgress = (balance: number, targetAmount: number): number =>
  Math.max(0, Math.min(100, (balance / targetAmount) * 100));

export const selectGoalById = (goals: Goal[], goalId: string): Goal | undefined =>
  goals.find((goal) => goal.id === goalId);
