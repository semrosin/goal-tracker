import { calculateStatistics } from './statistics';

const goal = {
  id: 'g1',
  title: 'Резерв',
  targetAmount: 1000,
  createdAt: '2025-01-01T12:00:00.000Z',
};

it('carries the opening balance across a year boundary and fills months without activity', () => {
  const statistics = calculateStatistics(
    {
      goals: [goal],
      transactions: [
        {
          id: '1',
          goalId: 'g1',
          type: 'deposit',
          amount: 400,
          createdAt: '2025-02-01T12:00:00.000Z',
        },
        {
          id: '2',
          goalId: 'g1',
          type: 'deposit',
          amount: 200,
          createdAt: '2025-12-01T12:00:00.000Z',
        },
        {
          id: '3',
          goalId: 'g1',
          type: 'withdrawal',
          amount: 100,
          createdAt: '2026-01-01T12:00:00.000Z',
        },
      ],
    },
    'RUB',
    new Date('2026-01-20T12:00:00.000Z')
  );
  expect(statistics.months).toEqual([
    { month: '2025-08', deposits: 0, withdrawals: 0, balance: 400 },
    { month: '2025-09', deposits: 0, withdrawals: 0, balance: 400 },
    { month: '2025-10', deposits: 0, withdrawals: 0, balance: 400 },
    { month: '2025-11', deposits: 0, withdrawals: 0, balance: 400 },
    { month: '2025-12', deposits: 200, withdrawals: 0, balance: 600 },
    { month: '2026-01', deposits: 0, withdrawals: 100, balance: 500 },
  ]);
  expect(statistics.saved).toBe(500);
});

it('keeps a goal with no transactions at zero progress', () => {
  const statistics = calculateStatistics(
    { goals: [goal], transactions: [] },
    'RUB',
    new Date('2026-01-20T12:00:00.000Z')
  );
  expect(statistics).toMatchObject({
    saved: 0,
    deposits: 0,
    withdrawals: 0,
    transactionCount: 0,
    active: 1,
    completed: 0,
  });
  expect(statistics.goalProgress[0]).toMatchObject({
    id: 'g1',
    balance: 0,
    progress: 0,
  });
});
