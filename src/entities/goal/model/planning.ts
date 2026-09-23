export type GoalPlan =
  | { status: 'completed' | 'overdue' | 'without-deadline'; remaining: number }
  | { status: 'active'; remaining: number; monthlyContribution: number };

export const isValidTargetMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value);

const monthIndex = (month: string): number =>
  Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;

export const getCurrentMonth = (date = new Date()): string =>
  `${String(date.getFullYear()).padStart(4, '0')}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;

export const calculateGoalPlan = (
  targetAmount: number,
  balance: number,
  targetMonth: string | undefined,
  currentMonth: string
): GoalPlan => {
  const remaining = Math.max(targetAmount - balance, 0);
  if (remaining === 0) return { status: 'completed', remaining };

  if (!isValidTargetMonth(targetMonth) || !isValidTargetMonth(currentMonth)) {
    return { status: 'without-deadline', remaining };
  }

  const months = monthIndex(targetMonth) - monthIndex(currentMonth) + 1;
  if (months <= 0) return { status: 'overdue', remaining };

  return {
    status: 'active',
    remaining,
    monthlyContribution: Math.ceil(remaining / months),
  };
};

export const forecastCompletionMonth = (
  remaining: number,
  monthlyContribution: number,
  currentMonth: string
): string | undefined => {
  if (
    !Number.isSafeInteger(remaining) ||
    remaining < 0 ||
    !Number.isSafeInteger(monthlyContribution) ||
    monthlyContribution <= 0 ||
    !isValidTargetMonth(currentMonth)
  ) {
    return undefined;
  }

  const finalMonth =
    monthIndex(currentMonth) +
    Math.max(0, Math.ceil(remaining / monthlyContribution) - 1);
  const year = Math.floor(finalMonth / 12);
  if (year > 9999) return undefined;

  return `${String(year).padStart(4, '0')}-${String(
    (finalMonth % 12) + 1
  ).padStart(2, '0')}`;
};
