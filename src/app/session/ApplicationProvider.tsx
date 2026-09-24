import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Provider } from 'react-redux';
import type { Session } from '@supabase/supabase-js';

import {
  createCloudLedgerRepository,
  LedgerCommandsProvider,
  ledgerInitialState,
  type LedgerCommands,
} from '../../entities/ledger';
import {
  getSupabaseClient,
  SessionContext,
  type LedgerLoadStatus,
  type SessionContextValue,
  type SessionMode,
} from '../../entities/session';
import { goalsActions } from '../../entities/goal';
import { transactionsActions } from '../../entities/transaction';
import { cloudErrorKey } from '../../shared/lib/cloudError';
import { useI18n } from '../../shared/lib/i18n';
import { getDemoSeed } from '../store/demoSeed';
import { DEMO_STORAGE_KEY, savePersistedState } from '../store/persistence';
import { ledgerReplaced } from '../store/rootReducer';
import { createAppStore, createDemoStore } from '../store/store';

const MODE_KEY = 'goal-tracker-mode';
type Preference = 'demo' | 'cloud' | null;

const readPreference = (): Preference => {
  try {
    const value = localStorage.getItem(MODE_KEY);
    return value === 'demo' || value === 'cloud' ? value : null;
  } catch {
    return null;
  }
};

const writePreference = (preference: Preference): void => {
  try {
    if (preference === null) localStorage.removeItem(MODE_KEY);
    else localStorage.setItem(MODE_KEY, preference);
  } catch {
    // Browsers that block storage can still use the current session.
  }
};

const readAuthLinkError = (): boolean => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return query.has('error') || hash.has('error');
};

export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const { locale, t } = useI18n();
  // Capture redirect errors before Supabase parses and removes URL fragments.
  const [authLinkError] = useState(readAuthLinkError);
  const [client] = useState(getSupabaseClient);
  const [repository] = useState(() =>
    client === null ? null : createCloudLedgerRepository(client)
  );
  const [cloudStore] = useState(() =>
    createAppStore(undefined, { persist: false })
  );
  const [demoStore, setDemoStore] = useState<ReturnType<
    typeof createDemoStore
  > | null>(null);
  const [mode, setMode] = useState<SessionMode>('initializing');
  const [email, setEmail] = useState<string>();
  const [ledgerStatus, setLedgerStatus] = useState<LedgerLoadStatus>('idle');
  const [ledgerError, setLedgerError] = useState<string>();
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string>();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const explicitSignOutRef = useRef(false);

  const clearCloud = useCallback(() => {
    requestRef.current += 1;
    userIdRef.current = null;
    cloudStore.dispatch(ledgerReplaced(ledgerInitialState));
    setEmail(undefined);
    setLedgerStatus('idle');
    setLedgerError(undefined);
    setMutationError(undefined);
  }, [cloudStore]);

  const refreshUser = useCallback(
    async (userId: string): Promise<void> => {
      if (repository === null || userIdRef.current !== userId) return;
      const request = ++requestRef.current;
      setLedgerStatus('loading');
      setLedgerError(undefined);
      try {
        const ledger = await repository.load();
        if (request !== requestRef.current || userIdRef.current !== userId)
          return;
        cloudStore.dispatch(ledgerReplaced(ledger));
        setLedgerStatus('ready');
      } catch (error) {
        if (request !== requestRef.current || userIdRef.current !== userId)
          return;
        setLedgerStatus('error');
        setLedgerError(t(cloudErrorKey(error)));
      }
    },
    [cloudStore, repository, t]
  );

  const refresh = useCallback(async () => {
    if (userIdRef.current !== null) await refreshUser(userIdRef.current);
  }, [refreshUser]);

  const activateSession = useCallback(
    (session: Session | null) => {
      if (session === null) {
        setRecoveryReady(false);
        const hadCloudSession = userIdRef.current !== null;
        clearCloud();
        if (readPreference() === 'demo') {
          setDemoStore((existing) => existing ?? createDemoStore(locale));
          setMode('demo');
        } else {
          setMode(
            hadCloudSession && !explicitSignOutRef.current
              ? 'expired'
              : readPreference() === 'cloud'
                ? 'expired'
                : 'guest'
          );
        }
        return;
      }

      if (
        window.location.pathname === '/auth/callback' &&
        !authLinkError &&
        readPreference() === 'demo'
      ) {
        writePreference('cloud');
      }

      if (readPreference() === 'demo') {
        setDemoStore((existing) => existing ?? createDemoStore(locale));
        setMode('demo');
        return;
      }

      const nextUserId = session.user.id;
      if (userIdRef.current !== nextUserId) {
        clearCloud();
        userIdRef.current = nextUserId;
      }
      setEmail(session.user.email);
      setMode('cloud');
      void refreshUser(nextUserId);
    },
    [authLinkError, clearCloud, locale, refreshUser]
  );

  useEffect(() => {
    if (client === null) {
      activateSession(null);
      return;
    }

    let active = true;
    let authEventSeen = false;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      authEventSeen = true;
      // Supabase auth callbacks must return before other auth calls run.
      setTimeout(() => {
        if (!active) return;
        if (event === 'PASSWORD_RECOVERY' && session !== null) {
          writePreference('cloud');
          setRecoveryReady(true);
        }
        if (event === 'SIGNED_OUT') setRecoveryReady(false);
        activateSession(session);
      }, 0);
    });
    void client.auth.getSession().then(
      ({ data, error }) => {
        if (active && !authEventSeen)
          activateSession(error === null ? data.session : null);
      },
      () => {
        if (active && !authEventSeen) activateSession(null);
      }
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [activateSession, client]);

  useEffect(() => {
    if (mode !== 'cloud') return;
    const refreshOnFocus = () => void refresh();
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('online', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('online', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [mode, refresh]);

  const chooseDemo = useCallback(() => {
    writePreference('demo');
    setRecoveryReady(false);
    setDemoStore((existing) => existing ?? createDemoStore(locale));
    setMode('demo');
  }, [locale]);

  const resetDemo = useCallback(() => {
    const seed = getDemoSeed(locale);
    savePersistedState(seed, DEMO_STORAGE_KEY);
    setDemoStore(createAppStore(seed, { storageKey: DEMO_STORAGE_KEY }));
  }, [locale]);

  const requireClient = useCallback(() => {
    if (client === null) throw new Error(t('error.unavailable'));
    return client;
  }, [client, t]);

  const signUp = useCallback(
    async (newEmail: string, password: string) => {
      const authClient = requireClient();
      writePreference('cloud');
      const { data, error } = await authClient.auth.signUp({
        email: newEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error !== null) throw error;
      if (data.session !== null) {
        activateSession(data.session);
        return 'signed-in' as const;
      }
      return 'confirmation' as const;
    },
    [activateSession, requireClient]
  );

  const signIn = useCallback(
    async (newEmail: string, password: string) => {
      setRecoveryReady(false);
      const authClient = requireClient();
      writePreference('cloud');
      const { data, error } = await authClient.auth.signInWithPassword({
        email: newEmail,
        password,
      });
      if (error !== null) throw error;
      if (data.session === null) throw new Error(t('error.session'));
      activateSession(data.session);
    },
    [activateSession, requireClient, t]
  );

  const requestPasswordReset = useCallback(
    async (resetEmail: string) => {
      const authClient = requireClient();
      const { error } = await authClient.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );
      if (error !== null) throw error;
      writePreference('cloud');
    },
    [requireClient]
  );

  const updatePassword = useCallback(
    async (password: string) => {
      const authClient = requireClient();
      const { error } = await authClient.auth.updateUser({ password });
      if (error !== null) throw error;
      setRecoveryReady(false);
    },
    [requireClient]
  );

  const signOut = useCallback(async () => {
    if (client !== null) {
      explicitSignOutRef.current = true;
      const { error } = await client.auth.signOut();
      if (error !== null) {
        explicitSignOutRef.current = false;
        throw error;
      }
    }
    writePreference(null);
    setRecoveryReady(false);
    clearCloud();
    setMode('guest');
    explicitSignOutRef.current = false;
  }, [clearCloud, client]);

  const sessionValue: SessionContextValue = useMemo(
    () => ({
      mode,
      configured: client !== null,
      email,
      ledgerStatus,
      ledgerError,
      recoveryReady,
      authLinkError,
      chooseDemo,
      resetDemo,
      refresh,
      signUp,
      signIn,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [
      mode,
      client,
      email,
      ledgerStatus,
      ledgerError,
      recoveryReady,
      authLinkError,
      chooseDemo,
      resetDemo,
      refresh,
      signUp,
      signIn,
      requestPasswordReset,
      updatePassword,
      signOut,
    ]
  );

  const runMutation = useCallback(
    async (
      cloudAction: (cloud: NonNullable<typeof repository>) => Promise<void>,
      demoAction: (local: NonNullable<typeof demoStore>) => void
    ) => {
      setMutationError(undefined);
      if (mode === 'demo' && demoStore !== null) {
        demoAction(demoStore);
        return;
      }
      if (
        mode !== 'cloud' ||
        repository === null ||
        userIdRef.current === null
      ) {
        throw new Error(t('error.signInRequired'));
      }
      setMutationBusy(true);
      try {
        await cloudAction(repository);
        await refreshUser(userIdRef.current);
      } catch (error) {
        const localizedError = new Error(t(cloudErrorKey(error)));
        setMutationError(localizedError.message);
        throw localizedError;
      } finally {
        setMutationBusy(false);
      }
    },
    [demoStore, mode, refreshUser, repository, t]
  );

  const commands: LedgerCommands = useMemo(
    () => ({
      createGoal: (goal) =>
        runMutation(
          (cloud) => cloud.createGoal(goal),
          (local) => {
            local.dispatch(goalsActions.goalCreated(goal));
          }
        ),
      updateGoal: (goal) =>
        runMutation(
          (cloud) => cloud.updateGoal(goal),
          (local) => {
            local.dispatch(goalsActions.goalUpdated(goal));
          }
        ),
      deleteGoal: (id) =>
        runMutation(
          (cloud) => cloud.deleteGoal(id),
          (local) => {
            local.dispatch(goalsActions.goalRemoved(id));
          }
        ),
      createTransaction: (transaction) =>
        runMutation(
          (cloud) => cloud.createTransaction(transaction),
          (local) => {
            local.dispatch(transactionsActions.transactionCreated(transaction));
          }
        ),
      deleteTransaction: (id) =>
        runMutation(
          (cloud) => cloud.deleteTransaction(id),
          (local) => {
            local.dispatch(transactionsActions.transactionRemoved(id));
          }
        ),
      busy: mutationBusy,
      error: mutationError,
      clearError: () => setMutationError(undefined),
    }),
    [mutationBusy, mutationError, runMutation]
  );

  const activeStore =
    mode === 'demo' && demoStore !== null ? demoStore : cloudStore;

  return (
    <SessionContext.Provider value={sessionValue}>
      <Provider store={activeStore}>
        <LedgerCommandsProvider value={commands}>
          {children}
        </LedgerCommandsProvider>
      </Provider>
    </SessionContext.Provider>
  );
};
