/// <reference types="@testing-library/jest-dom" />

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { DeleteGoalButton } from '../../delete-goal/ui/DeleteGoalButton';
import { EditGoalDialog } from '../../edit-goal/ui/EditGoalDialog';
import { CreateGoalDialog } from './CreateGoalDialog';
import styles from './CreateGoalDialog.module.scss';

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
    await userEvent.type(screen.getByLabelText('Сумма'), '100000');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(store.getState().goals).toHaveLength(1);
    expect(store.getState().goals[0]).toMatchObject({
      title: 'Отпуск',
      targetAmount: 100000,
    });
    expect(store.getState().transactions).toEqual([]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves an optional description for a new goal', async () => {
    const { store } = renderWithLedger(
      <CreateGoalDialog isOpen onClose={jest.fn()} />
    );

    await userEvent.type(screen.getByLabelText('Название'), 'Отпуск');
    const description = screen.getByLabelText('Описание');

    expect(description).toHaveClass(styles.descriptionInput);
    expect(description).toHaveAttribute(
      'placeholder',
      'Напишите, зачем вам эта цель и о чём вы мечтаете'
    );
    await userEvent.type(description, 'Хочу увидеть море и отдохнуть.');
    await userEvent.type(screen.getByLabelText('Сумма'), '100000');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(store.getState().goals).toMatchObject([
      { description: 'Хочу увидеть море и отдохнуть.' },
    ]);
  });

  it.each([
    [' ', '100000', 'Укажите название цели'],
    ['Отпуск', '0', 'Сумма должна быть положительным целым числом'],
    ['Отпуск', '1000.5', 'Сумма должна быть положительным целым числом'],
  ])(
    'keeps the dialog open when %p and %p are invalid',
    async (title, targetAmount, error) => {
      const onClose = jest.fn();
      const { store } = renderWithLedger(
        <CreateGoalDialog isOpen onClose={onClose} />
      );

      await userEvent.type(screen.getByLabelText('Название'), title);
      await userEvent.type(screen.getByLabelText('Сумма'), targetAmount);
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
    await userEvent.clear(screen.getByLabelText('Сумма'));
    await userEvent.type(screen.getByLabelText('Сумма'), '120000');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(store.getState().goals).toEqual([
      {
        ...existingGoal,
        title: 'Поездка',
        description: '',
        targetAmount: 120_000,
      },
    ]);
  });

  it('updates a goal description', async () => {
    const goalWithDescription = {
      ...existingGoal,
      description: 'Накопить на долгожданный отпуск.',
    };
    const { store } = renderWithLedger(
      <EditGoalDialog goal={goalWithDescription} isOpen onClose={jest.fn()} />,
      {
        goals: [goalWithDescription],
        transactions: [],
      }
    );

    const description = screen.getByLabelText('Описание');
    await userEvent.clear(description);
    await userEvent.type(description, 'Хочу увидеть океан.');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(store.getState().goals).toMatchObject([
      { description: 'Хочу увидеть океан.' },
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

    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(screen.getByRole('dialog', { name: 'Удалить' })).toBeInTheDocument();
    expect(store.getState().goals).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /^Удалить$/ }));

    expect(store.getState().goals).toEqual([]);
    expect(store.getState().transactions).toEqual([]);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
