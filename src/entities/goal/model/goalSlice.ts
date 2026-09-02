import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Goal, GoalUpdate } from './types';

const initialState: Goal[] = [];

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    goalCreated: (state, action: PayloadAction<Goal>) => {
      state = [...state, action.payload];
    },
    goalUpdated: (state, action: PayloadAction<GoalUpdate>) => {
      const goal = state.find((item) => item.id === action.payload.id);
      if (goal !== undefined) {
        goal.title = action.payload.title;
        goal.targetAmount = action.payload.targetAmount;
      }
    },
    goalRemoved: (state, action: PayloadAction<string>) =>
      state.filter((goal) => goal.id !== action.payload),
  },
});

export const goalsActions = goalSlice.actions;
export const goalsReducer = goalSlice.reducer;
