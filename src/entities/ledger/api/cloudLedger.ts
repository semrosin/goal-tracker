import type { SupabaseClient } from '@supabase/supabase-js';

import type { Goal, GoalUpdate } from '../../goal';
import type { Transaction } from '../../transaction';
import { decodeLedgerState, type LedgerState } from '../model/ledger';

type Row = Record<string, unknown>;

const normalizeTimestamp = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export const mapCloudLedger = (
  goalRows: readonly Row[],
  transactionRows: readonly Row[]
): LedgerState => {
  const mapped = {
    goals: goalRows.map((row) => ({
      id: row.id,
      title: row.title,
      ...(row.description === null ? {} : { description: row.description }),
      targetAmount: row.target_amount,
      ...(row.target_month === null
        ? {}
        : {
            targetMonth:
              typeof row.target_month === 'string'
                ? row.target_month.slice(0, 7)
                : row.target_month,
          }),
      createdAt: normalizeTimestamp(row.created_at),
    })),
    transactions: [...transactionRows]
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((row) => ({
        id: row.id,
        goalId: row.goal_id,
        type: row.type,
        amount: row.amount,
        createdAt: normalizeTimestamp(row.created_at),
      })),
  };

  const ledger = decodeLedgerState(mapped);
  if (ledger === undefined) {
    throw new Error('Некорректные данные получены с сервера');
  }
  return ledger;
};

const assertNoError = (error: { message: string } | null): void => {
  if (error !== null) throw new Error(error.message);
};

export const createCloudLedgerRepository = (client: SupabaseClient) => ({
  async load(): Promise<LedgerState> {
    const { data, error } = await client.rpc('get_ledger');
    assertNoError(error);
    if (
      data === null ||
      typeof data !== 'object' ||
      !('goals' in data) ||
      !('transactions' in data) ||
      !Array.isArray(data.goals) ||
      !Array.isArray(data.transactions)
    ) {
      throw new Error('Не удалось загрузить данные');
    }
    return mapCloudLedger(data.goals, data.transactions);
  },
  async createGoal(goal: Goal): Promise<void> {
    const { error } = await client.rpc('create_goal', {
      p_id: goal.id,
      p_title: goal.title,
      p_description: goal.description ?? null,
      p_target_amount: goal.targetAmount,
      p_target_month: goal.targetMonth ?? null,
    });
    assertNoError(error);
  },
  async updateGoal(goal: GoalUpdate): Promise<void> {
    const { error } = await client.rpc('update_goal', {
      p_id: goal.id,
      p_title: goal.title,
      p_description: goal.description ?? null,
      p_target_amount: goal.targetAmount,
      p_target_month: goal.targetMonth ?? null,
    });
    assertNoError(error);
  },
  async deleteGoal(id: string): Promise<void> {
    const { error } = await client.rpc('delete_goal', { p_id: id });
    assertNoError(error);
  },
  async createTransaction(transaction: Transaction): Promise<void> {
    const { error } = await client.rpc('add_transaction', {
      p_id: transaction.id,
      p_goal_id: transaction.goalId,
      p_type: transaction.type,
      p_amount: transaction.amount,
    });
    assertNoError(error);
  },
  async deleteTransaction(id: string): Promise<void> {
    const { error } = await client.rpc('delete_transaction', { p_id: id });
    assertNoError(error);
  },
});
