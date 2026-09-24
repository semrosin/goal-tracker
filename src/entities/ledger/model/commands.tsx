import { createContext, useContext, type ReactNode } from 'react';

import { goalsActions, type Goal, type GoalUpdate } from '../../goal';
import { transactionsActions, type Transaction } from '../../transaction';
import { useLedgerDispatch } from './hooks';

export type LedgerCommands = {
  createGoal(goal: Goal): Promise<void>;
  updateGoal(update: GoalUpdate): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  createTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  busy: boolean;
  error?: string;
  clearError(): void;
};

const LedgerCommandsContext = createContext<LedgerCommands | null>(null);

export const LedgerCommandsProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: LedgerCommands;
}) => (
  <LedgerCommandsContext.Provider value={value}>
    {children}
  </LedgerCommandsContext.Provider>
);

export const useLedgerCommands = (): LedgerCommands => {
  const provided = useContext(LedgerCommandsContext);
  const dispatch = useLedgerDispatch();
  if (provided !== null) return provided;

  return {
    createGoal: async (goal) => {
      dispatch(goalsActions.goalCreated(goal));
    },
    updateGoal: async (update) => {
      dispatch(goalsActions.goalUpdated(update));
    },
    deleteGoal: async (id) => {
      dispatch(goalsActions.goalRemoved(id));
    },
    createTransaction: async (transaction) => {
      dispatch(transactionsActions.transactionCreated(transaction));
    },
    deleteTransaction: async (id) => {
      dispatch(transactionsActions.transactionRemoved(id));
    },
    busy: false,
    error: undefined,
    clearError: () => undefined,
  };
};
