/// <reference types="@testing-library/jest-dom" />

import { screen } from '@testing-library/react';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { GoalSummary } from './GoalSummary';

test('shows a goal description when it is provided', () => {
  const goal = {
    id: 'goal-1',
    title: 'Отпуск',
    description: 'Хочу увидеть океан.',
    targetAmount: 100_000,
    createdAt: '2026-09-04T00:00:00.000Z',
  };

  renderWithLedger(<GoalSummary goal={goal} />, {
    goals: [goal],
    transactions: [],
  });

  expect(screen.getByText('Хочу увидеть океан.')).toBeInTheDocument();
});
