/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { createAppStore } from '../store/store';
import { AppRouter } from './AppRouter';
import {
  SessionContext,
  type SessionContextValue,
} from '../../entities/session';

describe('AppRouter', () => {
  it.each(['loading', 'error'] as const)(
    'keeps account controls available while the ledger is %s',
    (ledgerStatus) => {
      const session: SessionContextValue = {
        mode: 'cloud',
        configured: true,
        ledgerStatus,
        chooseDemo: jest.fn(),
        resetDemo: jest.fn(),
        refresh: jest.fn(),
        signUp: jest.fn(),
        signIn: jest.fn(),
        requestPasswordReset: jest.fn(),
        updatePassword: jest.fn(),
        signOut: jest.fn(),
      };
      render(
        <SessionContext.Provider value={session}>
          <Provider store={createAppStore({ goals: [], transactions: [] })}>
            <MemoryRouter initialEntries={['/app']}>
              <AppRouter />
            </MemoryRouter>
          </Provider>
        </SessionContext.Provider>
      );
      expect(screen.getAllByRole('banner')).toHaveLength(1);
      fireEvent.click(screen.getByRole('link', { name: 'Профиль' }));
      expect(
        screen.getByRole('complementary', { name: 'Данные аккаунта' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    }
  );
  it('moves account actions from the goals header into the profile', () => {
    const session: SessionContextValue = {
      mode: 'cloud',
      email: 'private@example.test',
      configured: true,
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
    render(
      <SessionContext.Provider value={session}>
        <Provider store={createAppStore({ goals: [], transactions: [] })}>
          <MemoryRouter initialEntries={['/app']}>
            <AppRouter />
          </MemoryRouter>
        </Provider>
      </SessionContext.Provider>
    );
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Выйти' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'EN' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('private@example.test')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Профиль' }));
    expect(screen.getByText('private@example.test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
  });
  it('shows a safe state for an unknown goal id', () => {
    render(
      <Provider store={createAppStore({ goals: [], transactions: [] })}>
        <MemoryRouter initialEntries={['/goals/missing']}>
          <AppRouter />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole('heading', { name: 'Цель не найдена' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'К списку целей' })
    ).toHaveAttribute('href', '/app');
  });

  it('opens the sign-up page from the welcome action', () => {
    const session: SessionContextValue = {
      mode: 'guest',
      configured: false,
      ledgerStatus: 'idle',
      chooseDemo: jest.fn(),
      resetDemo: jest.fn(),
      refresh: jest.fn(),
      signUp: jest.fn(),
      signIn: jest.fn(),
      requestPasswordReset: jest.fn(),
      updatePassword: jest.fn(),
      signOut: jest.fn(),
    };
    render(
      <SessionContext.Provider value={session}>
        <Provider store={createAppStore({ goals: [], transactions: [] })}>
          <MemoryRouter initialEntries={['/']}>
            <AppRouter />
          </MemoryRouter>
        </Provider>
      </SessionContext.Provider>
    );

    expect(
      screen.getByRole('heading', { name: /копите/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }));
    expect(
      screen.getByRole('heading', { name: /создать аккаунт/i })
    ).toBeInTheDocument();
  });
});
