import { screen, within } from '@testing-library/react';

import { GoalsOverviewPage } from '../../../pages/goals-overview/ui/GoalsOverviewPage';
import { renderWithStore } from '../../../app/test/renderWithStore';
import { GoalsList } from './GoalsList';

const goal = {
  id: 'goal-1',
  title: 'Отпуск',
  targetAmount: 100_000,
  createdAt: '2026-08-29T00:00:00.000Z',
};

describe('GoalsList', () => {
  it('shows an empty overview state when there are no goals', () => {
    renderWithStore(<GoalsOverviewPage />);

    expect(screen.getByText('Пока нет целей')).toBeInTheDocument();
  });

  it('renders a linked card with its derived balance and progress only', () => {
    renderWithStore(<GoalsList />, {
      goals: [goal],
      transactions: [
        {
          id: 'transaction-1',
          goalId: 'goal-1',
          type: 'deposit',
          amount: 25_000,
          createdAt: '2026-08-29T00:00:00.000Z',
        },
      ],
    });

    const card = screen.getByRole('link', { name: /Отпуск/ });

    expect(card).toHaveAttribute('href', '/goals/goal-1');
    expect(card).toHaveTextContent('Отпуск');
    expect(card).toHaveTextContent('25%');
    expect(card).toHaveTextContent(/25\s000 ₽ \/ 100\s000 ₽/);
    expect(
      screen.getByRole('progressbar', { name: 'Прогресс цели Отпуск' })
    ).toHaveAttribute('aria-valuenow', '25');
    expect(within(card).queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps operation controls off an overview card', () => {
    renderWithStore(<GoalsList />, { goals: [goal], transactions: [] });

    expect(
      screen.queryByRole('button', { name: /удалить|изменить|пополнить/i })
    ).not.toBeInTheDocument();
  });
});
