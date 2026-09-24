import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import {
  SessionContext,
  type SessionContextValue,
} from '../../../entities/session';
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SignInPage,
  SignUpPage,
} from './AuthPages';

const makeSession = (
  overrides: Partial<SessionContextValue> = {}
): SessionContextValue => ({
  mode: 'guest',
  configured: true,
  ledgerStatus: 'idle',
  chooseDemo: jest.fn(),
  resetDemo: jest.fn(),
  refresh: jest.fn(),
  signUp: jest.fn().mockResolvedValue('confirmation'),
  signIn: jest.fn().mockResolvedValue(undefined),
  requestPasswordReset: jest.fn().mockResolvedValue(undefined),
  updatePassword: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderPage = (page: React.ReactNode, session: SessionContextValue) =>
  render(
    <SessionContext.Provider value={session}>
      <MemoryRouter initialEntries={['/auth/sign-in']}>
        <Routes>
          <Route path="/auth/sign-in" element={page} />
          <Route path="/app" element={<h1>Overview</h1>} />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>
  );

test('sign-in calls password auth and opens the app', async () => {
  const session = makeSession();
  renderPage(<SignInPage />, session);
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'me@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Пароль'), {
    target: { value: 'secret123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

  await waitFor(() =>
    expect(session.signIn).toHaveBeenCalledWith('me@example.com', 'secret123')
  );
  expect(
    await screen.findByRole('heading', { name: 'Overview' })
  ).toBeInTheDocument();
});

test('sign-up prompts for email confirmation', async () => {
  const session = makeSession();
  renderPage(<SignUpPage />, session);
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'me@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Пароль'), {
    target: { value: 'secret123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

  expect(await screen.findByText(/Проверьте почту/)).toBeInTheDocument();
});

test('password recovery confirms sending without exposing account existence', async () => {
  const session = makeSession();
  renderPage(<ForgotPasswordPage />, session);
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'me@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить ссылку' }));

  expect(
    await screen.findByText(/Если адрес зарегистрирован/)
  ).toBeInTheDocument();
});

test('an existing session does not bypass the recovery link check', () => {
  renderPage(<ResetPasswordPage />, makeSession({ mode: 'cloud' }));
  expect(
    screen.getByText(/Ссылка истекла или недействительна/)
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Новый пароль')).not.toBeInTheDocument();
});

test('a verified recovery link opens the new password form', () => {
  renderPage(
    <ResetPasswordPage />,
    makeSession({ mode: 'cloud', recoveryReady: true })
  );
  expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
});

test('a failed confirmation link does not claim success for an existing session', () => {
  renderPage(
    <AuthCallbackPage />,
    makeSession({ mode: 'cloud', authLinkError: true })
  );
  expect(
    screen.getByText(/Ссылка истекла или недействительна/)
  ).toBeInTheDocument();
  expect(screen.queryByText(/Адрес подтверждён/)).not.toBeInTheDocument();
});
