import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { DeleteGoalButton } from '../../delete-goal/ui/DeleteGoalButton';
import { EditGoalDialog } from '../../edit-goal/ui/EditGoalDialog';
import { CreateGoalDialog } from './CreateGoalDialog';

const existingGoal = {
  id: 'goal-1',
  title: 'Отпуск',
  targetAmount: 100_000,
  createdAt: '2026-08-29T00:00:00.000Z',
};

describe('CreateGoalDialog', () => {
  it('creates a new goal with no transaction', async () => {
    const onClose = jest.fn();
    const { store } = renderWithLedger(
      <CreateGoalDialog isOpen onClose={onClose} />
    );

    await userEvent.type(screen.getByLabelText('Название'), '  Отпуск  ');
    await userEvent.type(screen.getByLabelText('Целевая сумма'), '100000');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(store.getState().goals).toHaveLength(1);
    expect(store.getState().goals[0]).toMatchObject({
      title: 'Отпуск',
      targetAmount: 100000,
    });
    expect(store.getState().transactions).toEqual([]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [' ', '100000', 'Введите название цели'],
    ['Отпуск', '0', 'Укажите положительную целую сумму'],
    ['Отпуск', '1000.5', 'Укажите положительную целую сумму'],
  ])(
    'keeps the dialog open when %p and %p are invalid',
    async (title, targetAmount, error) => {
      const onClose = jest.fn();
      const { store } = renderWithLedger(
        <CreateGoalDialog isOpen onClose={onClose} />
      );

      await userEvent.type(screen.getByLabelText('Название'), title);
      await userEvent.type(
        screen.getByLabelText('Целевая сумма'),
        targetAmount
      );
      await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

      expect(screen.getByRole('alert')).toHaveTextContent(error);
      expect(store.getState().goals).toEqual([]);
      expect(onClose).not.toHaveBeenCalled();
    }
  );

  it('updates a goal only with a trimmed title and positive whole target amount', async () => {
    const { store } = renderWithLedger(
      <EditGoalDialog goal={existingGoal} isOpen onClose={jest.fn()} />,
      {
        goals: [existingGoal],
        transactions: [],
      }
    );

    await userEvent.clear(screen.getByLabelText('Название'));
    await userEvent.type(screen.getByLabelText('Название'), '  Поездка  ');
    await userEvent.clear(screen.getByLabelText('Целевая сумма'));
    await userEvent.type(screen.getByLabelText('Целевая сумма'), '120000');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(store.getState().goals).toEqual([
      { ...existingGoal, title: 'Поездка', targetAmount: 120_000 },
    ]);
  });

  it('requires confirmation before removing a goal and its transactions', async () => {
    const onDeleted = jest.fn();
    const { store } = renderWithLedger(
      <DeleteGoalButton goalId="goal-1" onDeleted={onDeleted} />,
      {
        goals: [existingGoal],
        transactions: [
          {
            id: 'transaction-1',
            goalId: 'goal-1',
            type: 'deposit',
            amount: 50_000,
            createdAt: '2026-08-29T00:00:00.000Z',
          },
        ],
      }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Удалить цель' }));

    expect(
      screen.getByRole('dialog', { name: 'Удалить цель' })
    ).toBeInTheDocument();
    expect(store.getState().goals).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('button', { name: 'Удалить', exact: true })
    );

    expect(store.getState().goals).toEqual([]);
    expect(store.getState().transactions).toEqual([]);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
