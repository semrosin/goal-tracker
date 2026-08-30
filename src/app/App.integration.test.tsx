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

const renderRoute = (path: string) =>
  render(
    <Provider
      store={createAppStore({
        goals: [goal],
        transactions: [
          {
            id: 't1',
            goalId: 'g1',
            type: 'deposit',
            amount: 6_000,
            createdAt: '2026-08-29T01:00:00.000Z',
          },
          {
            id: 't2',
            goalId: 'g1',
            type: 'withdrawal',
            amount: 1_500,
            createdAt: '2026-08-29T02:00:00.000Z',
          },
        ],
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
    const summary = screen.getByRole('region', { name: 'Состояние цели' });
    expect(within(summary).getByText(balancePattern)).toBeInTheDocument();

    view.unmount();
    renderRoute('/goals/missing');

    expect(
      screen.getByRole('heading', { name: 'Цель не найдена' })
    ).toBeInTheDocument();
  });
});
