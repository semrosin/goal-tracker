import type { Goal } from './types';
import { calculateProgress } from './selectors';
import { getCurrentMonth } from './planning';

export type GoalFilters = {
  search: string;
  status: string;
  currency: string;
  deadline: string;
  sort: string;
};

export const normalizeGoalFilters = (filters: GoalFilters): GoalFilters => ({
  search: filters.search,
  status: ['all', 'active', 'completed'].includes(filters.status)
    ? filters.status
    : 'all',
  currency: ['all', 'RUB', 'USD'].includes(filters.currency)
    ? filters.currency
    : 'all',
  deadline: ['all', 'dated', 'none', 'overdue'].includes(filters.deadline)
    ? filters.deadline
    : 'all',
  sort: ['original', 'deadline', 'progress', 'name'].includes(filters.sort)
    ? filters.sort
    : 'original',
});

export const filterGoals = (
  goals: Goal[],
  balances: Map<string, number>,
  filters: GoalFilters,
  locale: string
): Goal[] => {
  filters = normalizeGoalFilters(filters);
  const search = filters.search.trim().toLocaleLowerCase(locale);
  const currentMonth = getCurrentMonth();
  return goals
    .filter((goal) => {
      const balance = balances.get(goal.id) ?? 0;
      const completed = balance >= goal.targetAmount;
      return (
        (!search ||
          `${goal.title} ${goal.description ?? ''}`
            .toLocaleLowerCase(locale)
            .includes(search)) &&
        (filters.status === 'all' ||
          (filters.status === 'completed' ? completed : !completed)) &&
        (filters.currency === 'all' ||
          (goal.currency ?? 'RUB') === filters.currency) &&
        (filters.deadline === 'all' ||
          (filters.deadline === 'none'
            ? !goal.targetMonth
            : filters.deadline === 'overdue'
              ? !!goal.targetMonth &&
                goal.targetMonth < currentMonth &&
                !completed
              : !!goal.targetMonth))
      );
    })
    .sort((a, b) => {
      if (filters.sort === 'name')
        return a.title.localeCompare(b.title, locale);
      if (filters.sort === 'progress')
        return (
          calculateProgress(balances.get(b.id) ?? 0, b.targetAmount) -
          calculateProgress(balances.get(a.id) ?? 0, a.targetAmount)
        );
      if (filters.sort === 'deadline')
        return a.targetMonth && b.targetMonth
          ? a.targetMonth.localeCompare(b.targetMonth)
          : a.targetMonth
            ? -1
            : b.targetMonth
              ? 1
              : 0;
      return 0;
    });
};
