import { useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';

import { useLedgerSelector } from '../../entities/ledger';
import { useSession } from '../../entities/session';
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SignInPage,
  SignUpPage,
} from '../../pages/auth';
import { GoalDetailPage } from '../../pages/goal-detail';
import { GoalsOverviewPage } from '../../pages/goals-overview';
import { WelcomePage } from '../../pages/welcome';
import { useI18n } from '../../shared/lib/i18n';
import { Button } from '../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './AppRouter.module.scss';

const WelcomeRoute = () => {
  const navigate = useNavigate();
  const { chooseDemo } = useSession();
  return (
    <WelcomePage
      onOpenDemo={() => {
        chooseDemo();
        navigate('/app');
      }}
      onSignIn={() => navigate('/auth/sign-in')}
    />
  );
};

const ModeToolbar = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useSession();
  const [error, setError] = useState<string>();

  const signOut = async () => {
    setError(undefined);
    try {
      await session.signOut();
      navigate('/', { replace: true });
    } catch {
      setError(t('toolbar.signOutError'));
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarContent}>
        <span className={styles.modeLabel}>
          {session.mode === 'demo' ? t('toolbar.demoMode') : session.email}
        </span>
        <div className={styles.toolbarActions}>
          <LanguageSwitcher />
          {session.mode === 'demo' ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm(t('toolbar.resetPrompt')))
                    session.resetDemo();
                }}
              >
                {t('toolbar.reset')}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                {t('toolbar.home')}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => void signOut()}>
              {t('toolbar.signOut')}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className={styles.toolbarError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { t } = useI18n();
  const session = useSession();
  const hasLedger = useLedgerSelector(
    (state) => state.goals.length > 0 || state.transactions.length > 0
  );

  if (session.mode === 'initializing') {
    return (
      <main className={styles.statusPage} role="status">
        {t('status.checkingSession')}
      </main>
    );
  }
  if (session.mode === 'expired')
    return <Navigate replace to="/auth/sign-in" />;
  if (session.mode === 'guest') return <Navigate replace to="/" />;

  const initialLoad =
    session.mode === 'cloud' &&
    !hasLedger &&
    (session.ledgerStatus === 'idle' || session.ledgerStatus === 'loading');
  const blockingError =
    session.mode === 'cloud' && !hasLedger && session.ledgerStatus === 'error';

  return (
    <>
      <ModeToolbar />
      {initialLoad ? (
        <main className={styles.statusPage} role="status">
          {t('status.loadingGoals')}
        </main>
      ) : blockingError ? (
        <main className={styles.statusPage}>
          <h1>{t('status.loadError')}</h1>
          <p>{session.ledgerError}</p>
          <Button onClick={() => void session.refresh()}>
            {t('status.retry')}
          </Button>
        </main>
      ) : (
        <>
          {session.mode === 'cloud' && session.ledgerStatus === 'error' && (
            <div className={styles.syncError} role="alert">
              {t('status.syncError')} {session.ledgerError}
              <Button
                onClick={() => void session.refresh()}
                variant="secondary"
              >
                {t('status.retry')}
              </Button>
            </div>
          )}
          {children}
        </>
      )}
    </>
  );
};

export const AppRouter = () => (
  <Routes>
    <Route element={<WelcomeRoute />} path="/" />
    <Route element={<SignInPage />} path="/auth/sign-in" />
    <Route element={<SignUpPage />} path="/auth/sign-up" />
    <Route element={<ForgotPasswordPage />} path="/auth/forgot-password" />
    <Route element={<ResetPasswordPage />} path="/auth/reset-password" />
    <Route element={<AuthCallbackPage />} path="/auth/callback" />
    <Route
      element={
        <ProtectedRoute>
          <GoalsOverviewPage />
        </ProtectedRoute>
      }
      path="/app"
    />
    <Route
      element={
        <ProtectedRoute>
          <GoalDetailPage />
        </ProtectedRoute>
      }
      path="/goals/:id"
    />
    <Route element={<Navigate replace to="/" />} path="*" />
  </Routes>
);
