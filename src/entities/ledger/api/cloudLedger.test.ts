import type { SupabaseClient } from '@supabase/supabase-js';

import { createCloudLedgerRepository, mapCloudLedger } from './cloudLedger';

const goalRow = {
  id: 'g1',
  title: 'Trip',
  description: null,
  target_amount: 1000,
  target_month: '2027-03-01',
  created_at: '2026-01-01T00:00:00.000Z',
};

test('maps nullable month and preserves server transaction order', () => {
  expect(
    mapCloudLedger(
      [goalRow],
      [
        {
          id: 'd1',
          goal_id: 'g1',
          type: 'deposit',
          amount: 200,
          position: 1,
          created_at: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'w1',
          goal_id: 'g1',
          type: 'withdrawal',
          amount: 50,
          position: 2,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ]
    )
  ).toEqual({
    goals: [
      {
        id: 'g1',
        title: 'Trip',
        targetAmount: 1000,
        targetMonth: '2027-03',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 'd1',
        goalId: 'g1',
        type: 'deposit',
        amount: 200,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'w1',
        goalId: 'g1',
        type: 'withdrawal',
        amount: 50,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });
});

test('rejects server data that would produce a negative historical balance', () => {
  expect(() =>
    mapCloudLedger(
      [goalRow],
      [
        {
          id: 'w1',
          goal_id: 'g1',
          type: 'withdrawal',
          amount: 100,
          position: 1,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ]
    )
  ).toThrow('Некорректные данные');
});

test('loads a complete ledger through a single snapshot RPC beyond row limits', async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => ({
    id: `deposit-${index}`,
    goal_id: 'g1',
    type: 'deposit',
    amount: 1,
    position: index + 1,
    created_at: '2026-01-02T00:00:00.000Z',
  }));
  const rpc = jest.fn().mockResolvedValue({
    data: { goals: [goalRow], transactions: rows },
    error: null,
  });
  const repository = createCloudLedgerRepository({
    rpc,
  } as unknown as SupabaseClient);

  const ledger = await repository.load();

  expect(rpc).toHaveBeenCalledWith('get_ledger');
  expect(ledger.transactions).toHaveLength(1001);
  expect(ledger.transactions[1000].id).toBe('deposit-1000');
});
