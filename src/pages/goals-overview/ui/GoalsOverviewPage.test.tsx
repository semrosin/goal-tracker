/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { LocaleProvider } from '../../../shared/lib/i18n';
import { GoalsOverviewPage } from './GoalsOverviewPage';

test('shows the empty overview state when there are no goals', () => {
  renderWithLedger(<GoalsOverviewPage />);

  expect(screen.getByText('У вас пока нет целей')).toBeInTheDocument();
});

test('shows an actionable empty state and English overview copy', () => {
  localStorage.setItem('goal-tracker-locale', 'en');
  renderWithLedger(
    <LocaleProvider>
      <GoalsOverviewPage />
    </LocaleProvider>
  );

  expect(screen.getByRole('heading', { name: 'My goals' })).toBeInTheDocument();
  expect(screen.getByText('No goals yet')).toBeInTheDocument();
  expect(screen.getByText(/Create your first goal/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'New goal' })).toBeInTheDocument();
  localStorage.removeItem('goal-tracker-locale');
});

test('wraps a large savings total within its summary card', () => {
  const source = readFileSync(
    join(__dirname, 'GoalsOverviewPage.module.scss'),
    'utf8'
  );
  const totalRules = source.match(/\.totalCard strong\s*\{([\s\S]*?)\}/)?.[1];

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

test('places the create action with the goals list', () => {
  localStorage.setItem('goal-tracker-locale', 'en');
  renderWithLedger(
    <LocaleProvider>
      <GoalsOverviewPage />
    </LocaleProvider>
  );
  const list = screen.getByRole('region', { name: 'Goals list' });
  expect(
    within(list).getByRole('button', { name: 'New goal' })
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole('banner')).queryByRole('button', {
      name: 'New goal',
    })
  ).not.toBeInTheDocument();
  localStorage.removeItem('goal-tracker-locale');
});

test('filters goals by description and resets an empty result', async () => {
  const user = userEvent;
  renderWithLedger(<GoalsOverviewPage />, {
    goals: [
      {
        id: 'a',
        title: 'Море',
        description: 'Летний отпуск',
        targetAmount: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    transactions: [],
  });
  await user.type(
    screen.getByRole('searchbox', { name: 'Поиск целей' }),
    'зима'
  );
  expect(screen.getByText('Цели не найдены')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
  await user.type(
    screen.getByRole('searchbox', { name: 'Поиск целей' }),
    'отпуск'
  );
  expect(screen.getByRole('link', { name: /Море/ })).toBeInTheDocument();
});

test('search accepts text that matches a filter default value', async () => {
  renderWithLedger(<GoalsOverviewPage />, {
    goals: [
      {
        id: 'a',
        title: 'All goals',
        targetAmount: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    transactions: [],
  });
  const search = screen.getByRole('searchbox', { name: 'Поиск целей' });
  await userEvent.type(search, 'all');
  expect(search).toHaveValue('all');
});
