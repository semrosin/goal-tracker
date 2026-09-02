/// <reference types="@testing-library/jest-dom" />

import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { formatDate } from '../../../shared/lib/date';
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

const deleteTransactionLabel = (
  operation: 'пополнение' | 'снятие',
  signedAmount: string,
  createdAt: string,
  transactionId: string
) =>
  `Удалить ${operation} ${signedAmount} от ${formatDate(
    createdAt
  )}, операция ${transactionId}`;

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
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'deposit'
        ),
      })
    );

    expect(
      screen.getByRole('dialog', { name: 'Удалить операцию' })
    ).toBeInTheDocument();
    expect(store.getState().transactions).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /^Удалить$/ }));

    expect(store.getState().transactions).toEqual([]);
  });

  it('removes the allowed oldest deposit from [d1, d2, w1] only after confirmation', async () => {
    const { store } = renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 'd1',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'd2',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:01:00.000Z',
        },
        {
          id: 'w1',
          goalId: 'g1',
          type: 'withdrawal',
          amount: 100,
          createdAt: '2026-01-01T00:02:00.000Z',
        },
      ],
    });

    await userEvent.click(
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'd1'
        ),
      })
    );

    expect(store.getState().transactions).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: /^Удалить$/ }));

    expect(
      store.getState().transactions.map((transaction) => transaction.id)
    ).toEqual(['d2', 'w1']);
    expect(
      screen.queryByRole('dialog', { name: 'Удалить операцию' })
    ).not.toBeInTheDocument();
  });

  it('leaves the ledger unchanged when deletion is cancelled', async () => {
    const transactions = [
      {
        id: 'd1',
        goalId: 'g1',
        type: 'deposit' as const,
        amount: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const { store } = renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions,
    });

    await userEvent.click(
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'd1'
        ),
      })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(store.getState().transactions).toEqual(transactions);
    expect(
      screen.queryByRole('dialog', { name: 'Удалить операцию' })
    ).not.toBeInTheDocument();
  });

  it('keeps an invalid historical deletion open with an explanation', async () => {
    const transactions = [
      {
        id: 'd1',
        goalId: 'g1',
        type: 'deposit' as const,
        amount: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'w1',
        goalId: 'g1',
        type: 'withdrawal' as const,
        amount: 100,
        createdAt: '2026-01-01T00:01:00.000Z',
      },
      {
        id: 'd2',
        goalId: 'g1',
        type: 'deposit' as const,
        amount: 100,
        createdAt: '2026-01-01T00:02:00.000Z',
      },
    ];
    const { store } = renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions,
    });

    await userEvent.click(
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'd1'
        ),
      })
    );
    await userEvent.click(screen.getByRole('button', { name: /^Удалить$/ }));

    expect(
      screen.getByRole('dialog', { name: 'Удалить операцию' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Нельзя удалить операцию: это приведёт к отрицательному балансу'
    );
    expect(store.getState().transactions).toEqual(transactions);
  });

  it('gives every deletion button a distinct transaction-context label', () => {
    renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 'd1',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'w1',
          goalId: 'g1',
          type: 'withdrawal',
          amount: 50,
          createdAt: '2026-01-01T00:01:00.000Z',
        },
      ],
    });

    expect(
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'd1'
        ),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: deleteTransactionLabel(
          'снятие',
          '-50 ₽',
          '2026-01-01T00:01:00.000Z',
          'w1'
        ),
      })
    ).toBeInTheDocument();
  });

  it('keeps same-minute delete labels independently selectable', () => {
    const firstTransaction = {
      id: 'first',
      goalId: 'g1',
      type: 'deposit' as const,
      amount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const secondTransaction = {
      ...firstTransaction,
      id: 'second',
      createdAt: '2026-01-01T00:00:30.000Z',
    };

    renderWithLedger(<TransactionsHistory goalId="g1" />, {
      goals: [goal],
      transactions: [firstTransaction, secondTransaction],
    });

    expect(formatDate(firstTransaction.createdAt)).toBe(
      formatDate(secondTransaction.createdAt)
    );

    const firstLabel = deleteTransactionLabel(
      'пополнение',
      '+100 ₽',
      firstTransaction.createdAt,
      firstTransaction.id
    );
    const secondLabel = deleteTransactionLabel(
      'пополнение',
      '+100 ₽',
      secondTransaction.createdAt,
      secondTransaction.id
    );

    expect(firstLabel).not.toBe(secondLabel);
    expect(
      screen.getByRole('button', { name: firstLabel })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: secondLabel })
    ).toBeInTheDocument();

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('+100');
    expect(rows[1]).toHaveTextContent('+100');
    expect(rows[0]).not.toHaveTextContent(firstTransaction.id);
    expect(rows[1]).not.toHaveTextContent(secondTransaction.id);
  });

  it.each(['Отмена', 'close button', 'Escape', 'backdrop'] as const)(
    'clears a blocked-deletion explanation after closing with %s and reopening',
    async (closeMechanism) => {
      renderWithLedger(<TransactionsHistory goalId="g1" />, {
        goals: [goal],
        transactions: [
          {
            id: 'd1',
            goalId: 'g1',
            type: 'deposit',
            amount: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'w1',
            goalId: 'g1',
            type: 'withdrawal',
            amount: 100,
            createdAt: '2026-01-01T00:01:00.000Z',
          },
          {
            id: 'd2',
            goalId: 'g1',
            type: 'deposit',
            amount: 100,
            createdAt: '2026-01-01T00:02:00.000Z',
          },
        ],
      });

      const deleteButton = screen.getByRole('button', {
        name: deleteTransactionLabel(
          'пополнение',
          '+100 ₽',
          '2026-01-01T00:00:00.000Z',
          'd1'
        ),
      });
      await userEvent.click(deleteButton);
      await userEvent.click(screen.getByRole('button', { name: /^Удалить$/ }));
      expect(screen.getByRole('alert')).toBeInTheDocument();

      const closeDialog = {
        Отмена: () =>
          userEvent.click(screen.getByRole('button', { name: 'Отмена' })),
        'close button': () =>
          userEvent.click(screen.getByRole('button', { name: 'Закрыть' })),
        Escape: () => fireEvent.keyDown(document, { key: 'Escape' }),
        backdrop: () => {
          // The backdrop has no accessible role; use its real pointer target.
          // eslint-disable-next-line testing-library/no-node-access
          const backdrop = screen.getByRole('dialog').parentElement;
          fireEvent.mouseDown(backdrop as HTMLElement);
        },
      }[closeMechanism];

      await closeDialog();

      expect(
        screen.queryByRole('dialog', { name: 'Удалить операцию' })
      ).not.toBeInTheDocument();
      await userEvent.click(deleteButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );
});
