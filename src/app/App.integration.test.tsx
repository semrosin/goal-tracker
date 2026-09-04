/// <reference types="@testing-library/jest-dom" />

import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { createAppStore } from './store/store';
import { AppRouter } from './router/AppRouter';

const goal = {
  id: 'g1',
  title: 'Новый автомобиль',
  targetAmount: 10_000,
  createdAt: '2026-08-29T00:00:00.000Z',
};

const balancePattern = /^4\s500\s₽$/;

const transactions = [
  {
    id: 't1',
    goalId: 'g1',
    type: 'deposit' as const,
    amount: 6_000,
    createdAt: '2026-08-29T01:00:00.000Z',
  },
  {
    id: 't2',
    goalId: 'g1',
    type: 'withdrawal' as const,
    amount: 1_500,
    createdAt: '2026-08-29T02:00:00.000Z',
  },
];

const renderRoute = (path: string, preloadedTransactions = transactions) =>
  render(
    <Provider
      store={createAppStore({
        goals: [goal],
        transactions: preloadedTransactions,
      })}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>
  );

describe('goal routes', () => {
  it('shows a preloaded goal balance and the missing-goal state', () => {
    const view = renderRoute('/goals/g1');

    expect(
      screen.getByRole('heading', { name: 'Новый автомобиль' })
    ).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Описание' });
    expect(within(summary).getByText(balancePattern)).toBeInTheDocument();

    view.unmount();
    renderRoute('/goals/missing');

    expect(
      screen.getByRole('heading', { name: 'Цель не найдена' })
    ).toBeInTheDocument();
  });

  it.each([
    {
      name: 'active',
      transactions,
      surfaceClass: 'activeSurface',
    },
    {
      name: 'completed',
      transactions: [
        {
          id: 'completed-deposit',
          goalId: 'g1',
          type: 'deposit' as const,
          amount: 10_000,
          createdAt: '2026-08-29T01:00:00.000Z',
        },
      ],
      surfaceClass: 'completedSurface',
    },
  ])('applies the $name visual treatment to every goal-detail section', ({
    transactions: preloadedTransactions,
    surfaceClass,
  }) => {
    renderRoute('/goals/g1', preloadedTransactions);

    [
      '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
      '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u044e',
      '\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0439',
    ].forEach((name) => {
      expect(screen.getByRole('region', { name })).toHaveClass(surfaceClass);
    });
  });
});
