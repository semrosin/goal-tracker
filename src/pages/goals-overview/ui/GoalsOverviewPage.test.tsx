/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen } from '@testing-library/react';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { GoalsOverviewPage } from './GoalsOverviewPage';

test('shows the empty overview state when there are no goals', () => {
  renderWithLedger(<GoalsOverviewPage />);

  expect(screen.getByText('У вас пока нет целей')).toBeInTheDocument();
});

test('wraps a large savings total within its summary card', () => {
  const source = readFileSync(
    join(__dirname, 'GoalsOverviewPage.module.scss'),
    'utf8'
  );
  const totalRules = source.match(
    /\.totalCard strong\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(totalRules).toBeDefined();
  expect(totalRules).toMatch(/min-width\s*:\s*0/);
  expect(totalRules).toMatch(/max-width\s*:\s*100%/);
  expect(totalRules).toMatch(/overflow-wrap\s*:\s*anywhere/);
});

test('shows the savings summary above the goals list', () => {
  renderWithLedger(<GoalsOverviewPage />, {
    goals: [
      {
        id: 'completed-goal',
        title: 'Закрытая цель',
        targetAmount: 500,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
      {
        id: 'active-goal',
        title: 'Активная цель',
        targetAmount: 1000,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 'completed-deposit',
        goalId: 'completed-goal',
        type: 'deposit',
        amount: 500,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
      {
        id: 'active-deposit',
        goalId: 'active-goal',
        type: 'deposit',
        amount: 300,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ],
  });

  expect(screen.getByLabelText('Всего накоплено')).toHaveTextContent('800 ₽');
  expect(screen.getByLabelText('Активных целей')).toHaveTextContent('1');
  expect(screen.getByLabelText('Выполненных целей')).toHaveTextContent('1');
});
