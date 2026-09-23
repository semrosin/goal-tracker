/// <reference types="@testing-library/jest-dom" />

import { useState } from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { LocaleProvider } from '../../../shared/lib/i18n';
import {
  LedgerCommandsProvider,
  type LedgerCommands,
} from '../../../entities/ledger';
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

const submitForm = async (name: 'Создать' | 'Сохранить' | 'Create') => {
  await act(async () => {
    userEvent.click(screen.getByRole('button', { name }));
  });
};

describe('CreateGoalDialog', () => {
  it('creates a timed goal from the English form', async () => {
    localStorage.setItem('goal-tracker-locale', 'en');
    try {
      const { store } = renderWithLedger(
        <LocaleProvider>
          <CreateGoalDialog isOpen onClose={jest.fn()} />
        </LocaleProvider>
      );

      await userEvent.type(screen.getByLabelText('Name'), 'Trip');
      await userEvent.type(screen.getByLabelText('Amount'), '100000');
      fireEvent.change(screen.getByLabelText('Target month'), {
        target: { value: '2027-02' },
      });
      await submitForm('Create');

      expect(store.getState().goals[0]).toMatchObject({
        title: 'Trip',
        targetMonth: '2027-02',
      });
    } finally {
      localStorage.removeItem('goal-tracker-locale');
    }
  });

  it('creates a new goal with no transaction', async () => {
    const onClose = jest.fn();
    const { store } = renderWithLedger(
      <CreateGoalDialog isOpen onClose={onClose} />
    );

    await userEvent.type(screen.getByLabelText('Название'), '  Отпуск  ');
    await userEvent.type(screen.getByLabelText('Сумма'), '100000');
    await submitForm('Создать');

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
    await submitForm('Создать');

    expect(store.getState().goals).toMatchObject([
      { description: 'Хочу увидеть море и отдохнуть.' },
    ]);
  });

  it('saves an optional target month for a new goal', async () => {
    const { store } = renderWithLedger(
      <CreateGoalDialog isOpen onClose={jest.fn()} />
    );

    await userEvent.type(screen.getByLabelText('Название'), 'Отпуск');
    await userEvent.type(screen.getByLabelText('Сумма'), '100000');
    fireEvent.change(screen.getByLabelText('Месяц достижения'), {
      target: { value: '2027-02' },
    });
    await submitForm('Создать');

    expect(store.getState().goals[0].targetMonth).toBe('2027-02');
  });

  it('keeps the draft open when cloud creation fails', async () => {
    const onClose = jest.fn();
    const commands: LedgerCommands = {
      createGoal: async () => {
        throw new Error('Network unavailable');
      },
      updateGoal: async () => undefined,
      deleteGoal: async () => undefined,
      createTransaction: async () => undefined,
      deleteTransaction: async () => undefined,
      busy: false,
      error: undefined,
      clearError: () => undefined,
    };
    const Host = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <LedgerCommandsProvider value={commands}>
          <button onClick={() => setIsOpen(true)} type="button">
            Открыть форму
          </button>
          <CreateGoalDialog
            isOpen={isOpen}
            onClose={() => {
              onClose();
              setIsOpen(false);
            }}
          />
        </LedgerCommandsProvider>
      );
    };
    const { store } = renderWithLedger(<Host />);

    await userEvent.type(screen.getByLabelText('Название'), 'Отпуск');
    await userEvent.type(screen.getByLabelText('Сумма'), '100000');
    await submitForm('Создать');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось создать цель'
    );
    expect(store.getState().goals).toEqual([]);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Открыть форму' })
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
      await submitForm('Создать');

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
    await submitForm('Сохранить');

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
    await submitForm('Сохранить');

    expect(store.getState().goals).toMatchObject([
      { description: 'Хочу увидеть океан.' },
    ]);
  });

  it('can clear an existing target month', async () => {
    const goalWithTargetMonth = { ...existingGoal, targetMonth: '2027-02' };
    const { store } = renderWithLedger(
      <EditGoalDialog goal={goalWithTargetMonth} isOpen onClose={jest.fn()} />,
      { goals: [goalWithTargetMonth], transactions: [] }
    );

    expect(screen.getByLabelText('Месяц достижения')).toHaveValue('2027-02');
    fireEvent.change(screen.getByLabelText('Месяц достижения'), {
      target: { value: '' },
    });
    await submitForm('Сохранить');

    expect(store.getState().goals[0].targetMonth).toBeUndefined();
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

    const dialog = screen.getByRole('dialog', { name: 'Удалить' });
    expect(dialog).toBeInTheDocument();
    expect(store.getState().goals).toHaveLength(1);
    await userEvent.click(
      within(dialog).getByRole('button', { name: /^Удалить$/ })
    );

    expect(store.getState().goals).toEqual([]);
    expect(store.getState().transactions).toEqual([]);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
