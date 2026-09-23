import {
  calculateGoalPlan,
  forecastCompletionMonth,
  isValidTargetMonth,
} from './planning';

describe('target month validation', () => {
  test.each(['2026-01', '2026-12'])('accepts %s', (month) => {
    expect(isValidTargetMonth(month)).toBe(true);
  });

  test.each(['2026-00', '2026-13', '2026-1', '26-01', '2026-01-01'])(
    'rejects %s',
    (month) => {
      expect(isValidTargetMonth(month)).toBe(false);
    }
  );
});

describe('monthly savings plan', () => {
  test('includes the current and target month and rounds the contribution up', () => {
    expect(calculateGoalPlan(1_000, 1, '2027-02', '2026-12')).toEqual({
      status: 'active',
      remaining: 999,
      monthlyContribution: 333,
    });
  });

  test('requires the full remaining amount when the deadline is this month', () => {
    expect(calculateGoalPlan(1_000, 150, '2026-09', '2026-09')).toEqual({
      status: 'active',
      remaining: 850,
      monthlyContribution: 850,
    });
  });

  test('reports an unfinished past deadline as overdue', () => {
    expect(calculateGoalPlan(1_000, 150, '2026-08', '2026-09')).toEqual({
      status: 'overdue',
      remaining: 850,
    });
  });

  test('completed status takes priority over a past deadline', () => {
    expect(calculateGoalPlan(1_000, 1_000, '2026-08', '2026-09')).toEqual({
      status: 'completed',
      remaining: 0,
    });
  });

  test('works for a goal without a deadline', () => {
    expect(calculateGoalPlan(1_000, 150, undefined, '2026-09')).toEqual({
      status: 'without-deadline',
      remaining: 850,
    });
  });
});

describe('what-if forecast', () => {
  test('includes the current month as the first payment month', () => {
    expect(forecastCompletionMonth(1_000, 400, '2026-12')).toBe('2027-02');
  });

  test('rejects zero, fractional, and unsafe monthly contributions', () => {
    expect(forecastCompletionMonth(1_000, 0, '2026-09')).toBeUndefined();
    expect(forecastCompletionMonth(1_000, 2.5, '2026-09')).toBeUndefined();
    expect(
      forecastCompletionMonth(1_000, Number.MAX_SAFE_INTEGER + 1, '2026-09')
    ).toBeUndefined();
  });
});
