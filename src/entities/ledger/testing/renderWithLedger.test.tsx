import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router';

import { useLedgerDispatch, useLedgerSelector } from '..';
import { goalsActions } from '../../goal/model/goalSlice';
import { renderWithLedger } from './renderWithLedger';

const LedgerProbe = () => {
  const dispatch = useLedgerDispatch();
  const goalCount = useLedgerSelector((state) => state.goals.length);

  return (
    <>
      <Link to="/goals">Go to goals</Link>
      <output>{goalCount}</output>
      <button
        onClick={() =>
          dispatch(
            goalsActions.goalCreated({
              id: 'g1',
              title: 'Vacation',
              targetAmount: 1_000,
              createdAt: '2026-01-01T00:00:00.000Z',
            })
          )
        }
      >
        Add goal
      </button>
    </>
  );
};

test('provides a configured ledger store and memory router without app composition', async () => {
  const { store } = renderWithLedger(<LedgerProbe />);

  expect(screen.getByRole('link', { name: 'Go to goals' })).toHaveAttribute(
    'href',
    '/goals'
  );
  expect(screen.getByText('0')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Add goal' }));

  expect(screen.getByText('1')).toBeInTheDocument();
  expect(store.getState().goals).toHaveLength(1);
});
