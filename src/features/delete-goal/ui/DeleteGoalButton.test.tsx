import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  LedgerCommandsProvider,
  type LedgerCommands,
} from '../../../entities/ledger';
import { renderWithLedger } from '../../../entities/ledger/testing/renderWithLedger';
import { DeleteGoalButton } from './DeleteGoalButton';

test('shows a cloud error and leaves the goal open when deletion fails', async () => {
  const commands: LedgerCommands = {
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest
      .fn()
      .mockRejectedValue(new Error('Удаление цели отклонено')),
    createTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    busy: false,
    clearError: jest.fn(),
  };
  const onDeleted = jest.fn();
  renderWithLedger(
    <LedgerCommandsProvider value={commands}>
      <DeleteGoalButton goalId="g1" onDeleted={onDeleted} />
    </LedgerCommandsProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
  await act(async () => {
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Удалить' })[1]
    );
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Удаление цели отклонено'
  );
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(onDeleted).not.toHaveBeenCalled();
});
