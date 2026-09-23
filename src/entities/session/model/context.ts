import { createContext, useContext } from 'react';

export type SessionMode =
  'initializing' | 'guest' | 'demo' | 'cloud' | 'expired';

export type LedgerLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SessionContextValue = {
  mode: SessionMode;
  configured: boolean;
  email?: string;
  ledgerStatus: LedgerLoadStatus;
  ledgerError?: string;
  recoveryReady?: boolean;
  authLinkError?: boolean;
  chooseDemo(): void;
  resetDemo(): void;
  refresh(): Promise<void>;
  signUp(
    email: string,
    password: string
  ): Promise<'confirmation' | 'signed-in'>;
  signIn(email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
};

const unavailable = async (): Promise<never> => {
  throw new Error('Облачный режим пока не настроен');
};

// Directly rendered feature tests use the local ledger without an app shell.
export const SessionContext = createContext<SessionContextValue>({
  mode: 'demo',
  configured: false,
  ledgerStatus: 'idle',
  chooseDemo: () => undefined,
  resetDemo: () => undefined,
  refresh: async () => undefined,
  signUp: unavailable,
  signIn: unavailable,
  requestPasswordReset: unavailable,
  updatePassword: unavailable,
  signOut: unavailable,
});

export const useSession = (): SessionContextValue => useContext(SessionContext);
