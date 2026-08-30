import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { TransactionsHistory } from './TransactionsHistory';

const goal = {
  id: 'g1',
  title: 'Отпуск',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const otherGoal = {
  id: 'g2',
  title: 'Покупка',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TransactionsHistory', () => {
  it('keeps its selected ledger stable for an unchanged store', () => {
    const warning = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 'deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it('shows only goal transactions newest first with id as a deterministic tie-breaker', () => {
    renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal, otherGoal],
      transactions: [
        {
          id: 'a',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'z',
          goalId: 'g1',
          type: 'withdrawal',
          amount: 50,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'new',
          goalId: 'g1',
          type: 'deposit',
          amount: 75,
          createdAt: '2026-01-03T00:00:00.000Z',
        },
        {
          id: 'other',
          goalId: 'g2',
          type: 'deposit',
          amount: 999,
          createdAt: '2026-01-04T00:00:00.000Z',
        },
      ],
    });

    const rows = screen.getAllByRole('listitem');

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('+75'),
      expect.stringContaining('-50'),
      expect.stringContaining('+100'),
    ]);
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
    expect(within(rows[0]).getByText('Пополнение')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Снятие')).toBeInTheDocument();
  });

  it('removes a transaction only after confirmation', async () => {
    const { store } = renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 'deposit',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Удалить операцию' })
    );

    expect(
      screen.getByRole('dialog', { name: 'Удалить операцию' })
    ).toBeInTheDocument();
    expect(store.getState().transactions).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('button', { name: 'Удалить', exact: true })
    );

    expect(store.getState().transactions).toEqual([]);
  });
});
