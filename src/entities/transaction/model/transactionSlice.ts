import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Transaction } from './types';

const initialState: Transaction[] = [];

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    transactionCreated: (state, action: PayloadAction<Transaction>) => {
      state.push(action.payload);
    },
    transactionRemoved: (state, action: PayloadAction<string>) =>
      state.filter((transaction) => transaction.id !== action.payload),
    transactionsRemovedForGoal: (state, action: PayloadAction<string>) =>
      state.filter((transaction) => transaction.goalId !== action.payload),
  },
});

export const transactionsActions = transactionSlice.actions;
export const transactionsReducer = transactionSlice.reducer;
