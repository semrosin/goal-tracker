import type { ReactNode } from 'react';
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
import { ProfilePage } from '../../pages/profile';
import { WelcomePage } from '../../pages/welcome';
import { AppHeader } from '../../widgets/app-header';
import { useI18n } from '../../shared/lib/i18n';
import { Button } from '../../shared/ui/Button/Button';
import styles from './AppRouter.module.scss';

const WelcomeRoute = () => {
  const navigate = useNavigate();
  return (
    <WelcomePage
      onSignUp={() => navigate('/auth/sign-up')}
      onSignIn={() => navigate('/auth/sign-in')}
    />
  );
};

const ProtectedRoute = ({
  children,
  requireLedger = true,
}: {
  children: ReactNode;
  requireLedger?: boolean;
}) => {
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
  if (!requireLedger) return <>{children}</>;

  const initialLoad =
    session.mode === 'cloud' &&
    !hasLedger &&
    (session.ledgerStatus === 'idle' || session.ledgerStatus === 'loading');
  const blockingError =
    session.mode === 'cloud' && !hasLedger && session.ledgerStatus === 'error';

  return (
    <>
      {initialLoad ? (
        <>
          <AppHeader />
          <main className={styles.statusPage} role="status">
            {t('status.loadingGoals')}
          </main>
        </>
      ) : blockingError ? (
        <>
          <AppHeader />
          <main className={styles.statusPage}>
            <h1>{t('status.loadError')}</h1>
            <p>{session.ledgerError}</p>
            <Button onClick={() => void session.refresh()}>
              {t('status.retry')}
            </Button>
          </main>
        </>
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
        <ProtectedRoute requireLedger={false}>
          <ProfilePage />
        </ProtectedRoute>
      }
      path="/profile"
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
