import { goalsActions } from '../../goal/model/goalSlice';
import type { Goal, GoalUpdate } from '../../goal/model/types';
import { transactionsActions } from '../../transaction/model/transactionSlice';
import type { Transaction } from '../../transaction/model/types';
import {
  decodeLedgerState,
  hasNonNegativeBalancePrefixes,
  ledgerReducer,
  type LedgerState,
} from './ledger';

const goal: Goal = {
  id: 'g1',
  title: 'Vacation',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const validLedger: Transaction[] = [
  {
    id: 'd1',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'w1',
    goalId: 'g1',
    type: 'withdrawal',
    amount: 100,
    createdAt: '2026-01-01T00:01:00.000Z',
  },
  {
    id: 'd2',
    goalId: 'g1',
    type: 'deposit',
    amount: 100,
    createdAt: '2026-01-01T00:02:00.000Z',
  },
];

test('preserves a transaction when its removal would make a ledger prefix negative', () => {
  const state: LedgerState = { goals: [goal], transactions: validLedger };

  expect(
    ledgerReducer(state, transactionsActions.transactionRemoved('d1'))
  ).toEqual(state);
});

test('uses array order as ledger execution order', () => {
  expect(hasNonNegativeBalancePrefixes(validLedger)).toBe(true);
  expect(hasNonNegativeBalancePrefixes([validLedger[1], validLedger[2]])).toBe(
    false
  );
});

test('accepts a same-timestamp deposit before a withdrawal in array order', () => {
  const sameTimestampLedger: Transaction[] = [
    {
      id: 'a-deposit',
      goalId: 'g1',
      type: 'deposit',
      amount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'z-withdrawal',
      goalId: 'g1',
      type: 'withdrawal',
      amount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  expect(hasNonNegativeBalancePrefixes(sameTimestampLedger)).toBe(true);
});

test('strips noncanonical properties from a directly created goal', () => {
  const pollutedGoal = { ...goal, savedAmount: 500 } as Goal;

  expect(
    ledgerReducer(undefined, goalsActions.goalCreated(pollutedGoal))
  ).toEqual({
    goals: [goal],
    transactions: [],
  });
});

test('strips noncanonical properties from a directly updated goal', () => {
  const state: LedgerState = { goals: [goal], transactions: [] };

  expect(
    ledgerReducer(
      state,
      goalsActions.goalUpdated({
        id: 'g1',
        title: 'Trip',
        targetAmount: 2_000,
        savedAmount: 500,
      } as GoalUpdate)
    )
  ).toEqual({
    goals: [{ ...goal, title: 'Trip', targetAmount: 2_000 }],
    transactions: [],
  });
});

test('strips noncanonical properties from a directly created transaction', () => {
  const pollutedTransaction = {
    ...validLedger[0],
    source: 'forged',
  } as Transaction;

  expect(
    ledgerReducer(
      { goals: [goal], transactions: [] },
      transactionsActions.transactionCreated(pollutedTransaction)
    )
  ).toEqual({
    goals: [goal],
    transactions: [validLedger[0]],
  });
});

test('accepts a maximum-safe deposit but rejects a prefix that would overflow it', () => {
  const state: LedgerState = { goals: [goal], transactions: [] };
  const maximumSafeDeposit: Transaction = {
    id: 'maximum-safe-deposit',
    goalId: 'g1',
    type: 'deposit',
    amount: Number.MAX_SAFE_INTEGER,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const overflowingDeposit: Transaction = {
    ...maximumSafeDeposit,
    id: 'overflowing-deposit',
    amount: 1,
    createdAt: '2026-01-01T00:01:00.000Z',
  };

  const stateWithMaximumSafeDeposit = ledgerReducer(
    state,
    transactionsActions.transactionCreated(maximumSafeDeposit)
  );

  expect(stateWithMaximumSafeDeposit).toEqual({
    goals: [goal],
    transactions: [maximumSafeDeposit],
  });
  expect(
    ledgerReducer(
      stateWithMaximumSafeDeposit,
      transactionsActions.transactionCreated(overflowingDeposit)
    )
  ).toBe(stateWithMaximumSafeDeposit);
});

test('rejects a persisted snapshot whose running prefix exceeds the safe range', () => {
  expect(
    decodeLedgerState({
      goals: [goal],
      transactions: [
        {
          id: 'maximum-safe-deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: Number.MAX_SAFE_INTEGER,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'overflowing-deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: 1,
          createdAt: '2026-01-01T00:01:00.000Z',
        },
      ],
    })
  ).toBeUndefined();
});
