import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { TransactionForm } from './TransactionForm';
import styles from './TransactionForm.module.scss';

const goal = {
  id: 'g1',
  title: 'Отпуск',
  targetAmount: 1_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TransactionForm', () => {
  it('visually marks only the selected operation and moves the mark when switching', async () => {
    renderWithLedger(<TransactionForm goalId="g1" />, {
      goals: [goal],
      transactions: [],
    });

    const deposit = screen.getByRole('button', {
      name: '\u041f\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u044c',
    });
    const withdrawal = screen.getByRole('button', {
      name: '\u0421\u043d\u044f\u0442\u044c',
    });

    expect(deposit).toHaveClass(styles.selected);
    expect(withdrawal).not.toHaveClass(styles.selected);

    await userEvent.click(withdrawal);

    expect(deposit).not.toHaveClass(styles.selected);
    expect(withdrawal).toHaveClass(styles.selected);
    expect(withdrawal).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds a valid deposit and clears the amount field', async () => {
    const { store } = renderWithLedger(<TransactionForm goalId="g1" />, {
      goals: [goal],
      transactions: [],
    });

    await userEvent.type(screen.getByLabelText('Сумма'), '500');
    await userEvent.click(
      screen.getByRole('button', { name: 'Добавить операцию' })
    );

    expect(store.getState().transactions).toHaveLength(1);
    expect(store.getState().transactions[0]).toMatchObject({
      goalId: 'g1',
      type: 'deposit',
      amount: 500,
    });
    expect(screen.getByLabelText('Сумма')).toHaveValue('');
  });

  it('shows an inline error and does not dispatch an over-balance withdrawal', async () => {
    const { store } = renderWithLedger(<TransactionForm goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 't1',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Снять' }));
    await userEvent.type(screen.getByLabelText('Сумма'), '101');
    await userEvent.click(
      screen.getByRole('button', { name: 'Добавить операцию' })
    );

    expect(
      screen.getByText('Нельзя снять больше, чем накоплено')
    ).toBeInTheDocument();
    expect(store.getState().transactions).toHaveLength(1);
    expect(screen.getByLabelText('Сумма')).toHaveValue('101');
  });

  it('rejects a non-positive whole withdrawal without changing the ledger', async () => {
    const { store } = renderWithLedger(<TransactionForm goalId="g1" />, {
      goals: [goal],
      transactions: [
        {
          id: 't1',
          goalId: 'g1',
          type: 'deposit',
          amount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Снять' }));
    await userEvent.type(screen.getByLabelText('Сумма'), '0');
    await userEvent.click(
      screen.getByRole('button', { name: 'Добавить операцию' })
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Укажите положительную целую сумму'
    );
    expect(store.getState().transactions).toHaveLength(1);
  });
});
