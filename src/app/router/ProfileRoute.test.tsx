import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import {
  SessionContext,
  type SessionContextValue,
} from '../../entities/session';
import { LocaleProvider } from '../../shared/lib/i18n';
import { createAppStore } from '../store/store';
import { AppRouter } from './AppRouter';

const session: SessionContextValue = {
  mode: 'cloud',
  configured: true,
  email: 'me@example.test',
  ledgerStatus: 'ready',
  chooseDemo: jest.fn(),
  resetDemo: jest.fn(),
  refresh: jest.fn(),
  signUp: jest.fn(),
  signIn: jest.fn(),
  requestPasswordReset: jest.fn(),
  updatePassword: jest.fn(),
  signOut: jest.fn(),
};

const ledger = {
  goals: [
    {
      id: 'rub',
      title: 'Подушка',
      targetAmount: 1000,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usd',
      title: 'Поездка',
      targetAmount: 500,
      currency: 'USD' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: '1',
      goalId: 'rub',
      type: 'deposit' as const,
      amount: 1500,
      createdAt: '2026-01-01T12:00:00.000Z',
    },
    {
      id: '2',
      goalId: 'rub',
      type: 'withdrawal' as const,
      amount: 200,
      createdAt: '2026-08-01T12:00:00.000Z',
    },
    {
      id: '3',
      goalId: 'rub',
      type: 'deposit' as const,
      amount: 100,
      createdAt: '2026-10-01T12:00:00.000Z',
    },
    {
      id: '4',
      goalId: 'usd',
      type: 'deposit' as const,
      amount: 50,
      createdAt: '2026-10-01T12:00:00.000Z',
    },
  ],
};

const renderProfile = (
  overrides: Partial<SessionContextValue> = {},
  path = '/profile'
) =>
  render(
    <LocaleProvider>
      <SessionContext.Provider value={{ ...session, ...overrides }}>
        <Provider store={createAppStore(ledger, { persist: false })}>
          <MemoryRouter initialEntries={[path]}>
            <AppRouter />
          </MemoryRouter>
        </Provider>
      </SessionContext.Provider>
    </LocaleProvider>
  );

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('goal-tracker-locale', 'ru');
  jest.useFakeTimers({ now: new Date('2026-10-20T12:00:00.000Z') });
});
afterEach(() => jest.useRealTimers());

it('derives statistics from the ledger and keeps currencies separate', () => {
  renderProfile();
  const saved = screen.getByRole('article', { name: 'Всего накоплено' });
  expect(saved).toHaveTextContent(/1\s400\s₽/);
  expect(
    screen.getByRole('article', { name: 'Всего пополнено' })
  ).toHaveTextContent(/1\s600\s₽/);
  expect(
    screen.getByRole('article', { name: 'Всего снято' })
  ).toHaveTextContent(/200\s₽/);
  expect(screen.getByRole('article', { name: 'Операций' })).toHaveTextContent(
    '3'
  );
  expect(
    screen.getByRole('progressbar', { name: 'Прогресс цели Подушка' })
  ).toHaveAttribute('aria-valuenow', '100');
  const table = screen.getByRole('table', { name: 'Данные графиков' });
  const rows = within(table).getAllByRole('row');
  expect(rows).toHaveLength(7);
  expect(rows[1]).toHaveTextContent(/май.*1\s500\s₽/i);
  expect(rows[4]).toHaveTextContent(/авг.*200\s₽.*1\s300\s₽/i);
  fireEvent.click(screen.getByRole('button', { name: 'USD' }));
  expect(saved).toHaveTextContent(/50\s?\$/);
  expect(screen.getByRole('article', { name: 'Операций' })).toHaveTextContent(
    '1'
  );
  expect(
    screen.getByRole('progressbar', { name: 'Прогресс цели Поездка' })
  ).toHaveAttribute('aria-valuenow', '10');
});

it('inherits the welcome language and persists profile language changes across navigation', async () => {
  renderProfile({}, '/');
  fireEvent.click(screen.getByRole('button', { name: 'EN' }));
  fireEvent.click(
    within(screen.getByRole('banner')).getByRole('button', {
      name: 'Sign in',
      exact: true,
    })
  );
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'me@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  await screen.findByRole('heading', { name: 'My goals' });
  fireEvent.click(screen.getByRole('link', { name: 'Profile' }));
  expect(
    screen.getByRole('heading', { name: 'Profile', exact: true })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'RU' }));
  expect(window.localStorage.getItem('goal-tracker-locale')).toBe('ru');
  fireEvent.click(screen.getByRole('link', { name: 'К списку целей' }));
  expect(screen.getByRole('heading', { name: 'Мои цели' })).toBeInTheDocument();
});

it('keeps the profile open and shows an error if sign-out fails', async () => {
  renderProfile({
    signOut: async () => {
      throw new Error('offline');
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось выйти')
  );
  expect(
    screen.getByRole('heading', { name: 'Профиль', exact: true })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Выйти' })).toBeEnabled();
});

it('returns to the welcome page after sign-out', async () => {
  renderProfile({ signOut: async () => undefined });
  fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: /Копите на важное/ })
    ).toBeInTheDocument()
  );
});

it('redirects guests away from account data', () => {
  renderProfile({ mode: 'guest' });
  expect(
    screen.getByRole('heading', { name: /Копите на важное/ })
  ).toBeInTheDocument();
  expect(screen.queryByText('me@example.test')).not.toBeInTheDocument();
});
