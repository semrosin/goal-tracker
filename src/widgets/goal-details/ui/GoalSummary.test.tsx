/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, screen } from '@testing-library/react';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { LocaleProvider } from '../../../shared/lib/i18n';
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

test('shows the rounded monthly contribution and a what-if forecast', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 8, 1));
  const goal = {
    id: 'goal-1',
    title: 'Отпуск',
    targetAmount: 1_000,
    targetMonth: '2026-10',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  try {
    renderWithLedger(<GoalSummary goal={goal} />, {
      goals: [goal],
      transactions: [],
    });

    expect(screen.getByText('500 ₽ в месяц')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Если откладывать в месяц'), {
      target: { value: '400' },
    });
    expect(screen.getByText(/ноябрь 2026/)).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('shows completion instead of overdue for a funded goal', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 8, 1));
  const goal = {
    id: 'goal-1',
    title: 'Отпуск',
    targetAmount: 1_000,
    targetMonth: '2026-08',
    createdAt: '2026-07-01T00:00:00.000Z',
  };

  try {
    renderWithLedger(<GoalSummary goal={goal} />, {
      goals: [goal],
      transactions: [
        {
          id: 'deposit-1',
          goalId: goal.id,
          type: 'deposit',
          amount: 1_000,
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      ],
    });

    expect(screen.getByText('Цель достигнута')).toBeInTheDocument();
    expect(screen.queryByText('Срок прошёл')).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('shows the English planning copy and month forecast', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 8, 1));
  localStorage.setItem('goal-tracker-locale', 'en');
  const goal = {
    id: 'goal-1',
    title: 'Trip',
    targetAmount: 1_000,
    targetMonth: '2026-10',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  try {
    renderWithLedger(
      <LocaleProvider>
        <GoalSummary goal={goal} />
      </LocaleProvider>,
      { goals: [goal], transactions: [] }
    );

    expect(screen.getByText('500 ₽ per month')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('If saving each month'), {
      target: { value: '400' },
    });
    expect(screen.getByText('Forecast: November 2026')).toBeInTheDocument();
  } finally {
    localStorage.removeItem('goal-tracker-locale');
    jest.useRealTimers();
  }
});

test('aligns the target amount with the right edge', () => {
  const source = readFileSync(
    join(__dirname, 'GoalSummary.module.scss'),
    'utf8'
  );
  const targetAmountRules = source.match(
    /\.amounts div:last-child\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(targetAmountRules).toBeDefined();
  expect(targetAmountRules).toMatch(/align-items\s*:\s*flex-end/);
});

test('wraps a long amount within its grid cell', () => {
  const source = readFileSync(
    join(__dirname, 'GoalSummary.module.scss'),
    'utf8'
  );
  const amountRules = source.match(/\.amounts strong\s*\{([\s\S]*?)\}/)?.[1];

  expect(amountRules).toBeDefined();
  expect(amountRules).toMatch(/max-width\s*:\s*100%/);
  expect(amountRules).toMatch(/overflow-wrap\s*:\s*anywhere/);
});

test('allows amount cells to shrink within the summary grid', () => {
  const source = readFileSync(
    join(__dirname, 'GoalSummary.module.scss'),
    'utf8'
  );
  const amountCellRules = source.match(/\.amounts div\s*\{([\s\S]*?)\}/)?.[1];

  expect(amountCellRules).toBeDefined();
  expect(amountCellRules).toMatch(/min-width\s*:\s*0/);
});
