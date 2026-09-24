/// <reference types="@testing-library/jest-dom" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen, within } from '@testing-library/react';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { LocaleProvider } from '../../../shared/lib/i18n';
import { GoalsList } from './GoalsList';
import styles from './GoalsList.module.scss';

const goal = {
  id: 'goal-1',
  title: 'Отпуск',
  targetAmount: 100_000,
  createdAt: '2026-08-29T00:00:00.000Z',
};

describe('GoalsList', () => {
  it('renders a linked card with its derived balance and progress only', () => {
    renderWithLedger(<GoalsList />, {
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
    renderWithLedger(<GoalsList />, { goals: [goal], transactions: [] });

    expect(
      screen.queryByRole('button', { name: /удалить|изменить|пополнить/i })
    ).not.toBeInTheDocument();
  });

  it('marks a fully funded goal as completed', () => {
    const completedGoal = {
      ...goal,
      id: 'completed-goal',
      title: 'Закрытая цель',
    };

    renderWithLedger(<GoalsList />, {
      goals: [completedGoal],
      transactions: [
        {
          id: 'completed-deposit',
          goalId: completedGoal.id,
          type: 'deposit',
          amount: completedGoal.targetAmount,
          createdAt: '2026-08-29T00:00:00.000Z',
        },
      ],
    });

    expect(screen.getByText('Выполнено')).toHaveClass(styles.status);
    expect(
      screen.getByRole('link', { name: /Закрытая цель Выполнено/ })
    ).toHaveClass(styles.completedCard);
  });

  it('renders status, progress label, and ruble grouping in English', () => {
    localStorage.setItem('goal-tracker-locale', 'en');
    renderWithLedger(
      <LocaleProvider>
        <GoalsList />
      </LocaleProvider>,
      {
        goals: [{ ...goal, targetAmount: 100_000 }],
        transactions: [
          {
            id: 'transaction-en',
            goalId: goal.id,
            type: 'deposit',
            amount: 100_000,
            createdAt: goal.createdAt,
          },
        ],
      }
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Progress toward Отпуск' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Отпуск/ })).toHaveTextContent(
      /100,000 ₽/
    );
    localStorage.removeItem('goal-tracker-locale');
  });

  it('limits the desktop goal grid to two columns', () => {
    const source = readFileSync(
      join(__dirname, 'GoalsList.module.scss'),
      'utf8'
    );
    const listRules = source.match(/\.list\s*\{([\s\S]*?)\}/)?.[1];

    expect(listRules).toBeDefined();
    expect(listRules).toMatch(
      /grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    );
  });
});
