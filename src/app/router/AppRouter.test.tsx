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

  it('opens demo only after the welcome action', () => {
    const chooseDemo = jest.fn();
    const session: SessionContextValue = {
      mode: 'guest',
      configured: false,
      ledgerStatus: 'idle',
      chooseDemo,
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
    fireEvent.click(screen.getByRole('button', { name: /посмотреть демо/i }));
    expect(chooseDemo).toHaveBeenCalledTimes(1);
  });
});
