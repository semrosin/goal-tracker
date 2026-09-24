import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { useLedgerSelector } from '../../entities/ledger';
import { useSession } from '../../entities/session';
import { createCloudLedgerRepository } from '../../entities/ledger/api/cloudLedger';
import { getSupabaseClient } from '../../entities/session/api/client';
import { STORAGE_KEY } from '../store/persistence';
import { ApplicationProvider } from './ApplicationProvider';

jest.mock('../../entities/session/api/client');
jest.mock('../../entities/ledger/api/cloudLedger');

const goal = {
  id: 'cloud-goal',
  title: 'Cloud goal',
  targetAmount: 1000,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const Probe = () => {
  const session = useSession();
  const goals = useLedgerSelector((state) => state.goals);
  return (
    <>
      <span data-testid="mode">{session.mode}</span>
      <span data-testid="goals">
        {goals.map((item) => item.title).join(',')}
      </span>
      <span data-testid="recovery-ready">{String(session.recoveryReady)}</span>
      <button onClick={() => void session.signOut()}>Sign out</button>
      <button
        onClick={() => void session.requestPasswordReset('me@example.com')}
      >
        Request reset
      </button>
    </>
  );
};

test('loads cloud ledger on session and clears it on sign out without touching local data', async () => {
  const legacy = JSON.stringify({ goals: [], transactions: [] });
  window.localStorage.setItem(STORAGE_KEY, legacy);
  const auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'me@example.com' } } },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
  (getSupabaseClient as jest.Mock).mockReturnValue({ auth });
  const load = jest.fn().mockResolvedValue({ goals: [goal], transactions: [] });
  (createCloudLedgerRepository as jest.Mock).mockReturnValue({ load });

  render(
    <ApplicationProvider>
      <Probe />
    </ApplicationProvider>
  );
  await waitFor(() =>
    expect(screen.getByTestId('mode')).toHaveTextContent('cloud')
  );
  await waitFor(() =>
    expect(screen.getByTestId('goals')).toHaveTextContent('Cloud goal')
  );
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe(legacy);

  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() =>
    expect(screen.getByTestId('mode')).toHaveTextContent('guest')
  );
  expect(screen.getByTestId('goals')).toBeEmptyDOMElement();
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe(legacy);
});

test('a recovery link switches an existing demo visitor into a verified recovery session', async () => {
  window.localStorage.clear();
  window.localStorage.setItem('goal-tracker-mode', 'demo');
  const recoveredSession = {
    user: { id: 'user-1', email: 'me@example.com' },
  };
  let authChange:
    ((event: string, session: typeof recoveredSession) => void) | undefined;
  const auth = {
    getSession: jest
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockImplementation((callback) => {
      authChange = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  };
  (getSupabaseClient as jest.Mock).mockReturnValue({ auth });
  (createCloudLedgerRepository as jest.Mock).mockReturnValue({
    load: jest.fn().mockResolvedValue({ goals: [goal], transactions: [] }),
  });

  render(
    <ApplicationProvider>
      <Probe />
    </ApplicationProvider>
  );
  await waitFor(() =>
    expect(screen.getByTestId('mode')).toHaveTextContent('demo')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Request reset' }));
  await waitFor(() =>
    expect(window.localStorage.getItem('goal-tracker-mode')).toBe('cloud')
  );
  act(() => authChange?.('PASSWORD_RECOVERY', recoveredSession));
  await waitFor(() =>
    expect(screen.getByTestId('mode')).toHaveTextContent('cloud')
  );
  expect(screen.getByTestId('recovery-ready')).toHaveTextContent('true');
});

test('a valid confirmation link opens cloud mode for a demo visitor', async () => {
  window.localStorage.clear();
  window.localStorage.setItem('goal-tracker-mode', 'demo');
  window.history.replaceState(null, '', '/auth/callback');
  const auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'me@example.com' } } },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  };
  (getSupabaseClient as jest.Mock).mockReturnValue({ auth });
  (createCloudLedgerRepository as jest.Mock).mockReturnValue({
    load: jest.fn().mockResolvedValue({ goals: [goal], transactions: [] }),
  });

  render(
    <ApplicationProvider>
      <Probe />
    </ApplicationProvider>
  );
  await waitFor(() =>
    expect(screen.getByTestId('mode')).toHaveTextContent('cloud')
  );
  expect(window.localStorage.getItem('goal-tracker-mode')).toBe('cloud');
  window.history.replaceState(null, '', '/');
});
