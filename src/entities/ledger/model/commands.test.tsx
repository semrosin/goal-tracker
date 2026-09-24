import { fireEvent, screen } from '@testing-library/react';

import { renderWithLedger } from '../testing/renderWithLedger';
import { useLedgerCommands } from './commands';

const goal = {
  id: 'goal-1',
  title: 'Trip',
  targetAmount: 1000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('local command fallback updates the Redux ledger', async () => {
  const TestComponent = () => {
    const { createGoal } = useLedgerCommands();
    return <button onClick={() => void createGoal(goal)}>Create</button>;
  };

  const { store } = renderWithLedger(<TestComponent />);
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(store.getState().goals).toEqual([goal]);
});
