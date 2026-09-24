import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { useSession } from '../../../entities/session';
import { useI18n } from '../../../shared/lib/i18n';
import { Button } from '../../../shared/ui/Button/Button';
import { Field } from '../../../shared/ui/Field/Field';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './AuthPages.module.scss';

type Translate = ReturnType<typeof useI18n>['t'];

const authError = (error: unknown, t: Translate): string => {
  const message = error instanceof Error ? error.message : '';
  if (/invalid login credentials/i.test(message))
    return t('auth.invalidCredentials');
  if (/email not confirmed/i.test(message)) return t('auth.emailNotConfirmed');
  if (/rate limit/i.test(message)) return t('auth.rateLimit');
  return t('auth.requestError');
};

const AuthShell = ({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) => {
  const { t } = useI18n();
  return (
    <main className={styles.shell}>
      <div className={styles.topBar}>
        <Link className={styles.brand} to="/">
          Goal Tracker
        </Link>
        <div className={styles.topActions}>
          <LanguageSwitcher />
          <Link className={styles.backLink} to="/">
            {t('auth.backHome')}
          </Link>
        </div>
      </div>
      <section className={styles.card}>
        <p className={styles.eyebrow}>{t('auth.eyebrow')}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
      </section>
    </main>
  );
};

export const SignInPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await session.signIn(email.trim(), password);
      navigate('/app', { replace: true });
    } catch (caught) {
      setError(authError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.signIn')}
      description={t('auth.signInDescription')}
    >
      {!session.configured && (
        <p className={styles.notice} role="alert">
          {t('auth.unavailableDemo')}
        </p>
      )}
      {session.mode === 'expired' && (
        <p className={styles.notice}>{t('auth.expired')}</p>
      )}
      <form className={styles.form} onSubmit={(event) => void submit(event)}>
        <Field
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button fullWidth type="submit" disabled={busy || !session.configured}>
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
      <div className={styles.links}>
        <Link to="/auth/forgot-password">{t('auth.forgotPassword')}</Link>
        <Link to="/auth/sign-up">{t('auth.createAccount')}</Link>
      </div>
    </AuthShell>
  );
};

export const SignUpPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      const result = await session.signUp(email.trim(), password);
      if (result === 'signed-in') navigate('/app', { replace: true });
      else setConfirmation(true);
    } catch (caught) {
      setError(authError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.createAccount')}
      description={t('auth.signUpDescription')}
    >
      {confirmation ? (
        <div className={styles.success} role="status">
          <strong>{t('auth.checkEmail')}</strong>
          <p>{t('auth.confirmEmailHint')}</p>
          <Link to="/auth/sign-in">{t('auth.backSignIn')}</Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          {!session.configured && (
            <p className={styles.notice} role="alert">
              {t('auth.unavailable')}
            </p>
          )}
          <Field
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label={t('auth.password')}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className={styles.hint}>{t('auth.passwordHint')}</p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Button
            fullWidth
            type="submit"
            disabled={busy || !session.configured}
          >
            {busy ? t('auth.creating') : t('auth.register')}
          </Button>
        </form>
      )}
      <div className={styles.links}>
        <Link to="/auth/sign-in">{t('auth.haveAccount')}</Link>
      </div>
    </AuthShell>
  );
};

export const ForgotPasswordPage = () => {
  const { t } = useI18n();
  const session = useSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await session.requestPasswordReset(email.trim());
      setSent(true);
    } catch (caught) {
      setError(authError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.forgotTitle')}
      description={t('auth.forgotDescription')}
    >
      {sent ? (
        <p className={styles.success} role="status">
          {t('auth.resetSent')}
        </p>
      ) : (
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <Field
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Button
            fullWidth
            type="submit"
            disabled={busy || !session.configured}
          >
            {busy ? t('auth.sending') : t('auth.sendLink')}
          </Button>
        </form>
      )}
      <div className={styles.links}>
        <Link to="/auth/sign-in">{t('auth.backSignIn')}</Link>
      </div>
    </AuthShell>
  );
};

export const ResetPasswordPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useSession();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await session.updatePassword(password);
      navigate('/app', { replace: true });
    } catch (caught) {
      setError(authError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      description={t('auth.resetDescription')}
    >
      {session.mode === 'initializing' ? (
        <p role="status">{t('auth.checkingLink')}</p>
      ) : session.mode !== 'cloud' ||
        !session.recoveryReady ||
        session.authLinkError ? (
        <p className={styles.notice} role="alert">
          {t('auth.invalidLink')}{' '}
          <Link to="/auth/forgot-password">{t('auth.requestNew')}</Link>
        </p>
      ) : (
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <Field
            label={t('auth.newPassword')}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Field
            label={t('auth.repeatPassword')}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Button fullWidth type="submit" disabled={busy}>
            {busy ? t('auth.saving') : t('auth.savePassword')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export const AuthCallbackPage = () => {
  const { t } = useI18n();
  const session = useSession();
  return (
    <AuthShell
      title={t('auth.callbackTitle')}
      description={t('auth.callbackDescription')}
    >
      {session.mode === 'initializing' ? (
        <p role="status">{t('auth.checkingLink')}</p>
      ) : session.mode === 'cloud' && !session.authLinkError ? (
        <p className={styles.success} role="status">
          {t('auth.signedIn')} <Link to="/app">{t('auth.openGoals')}</Link>
        </p>
      ) : (
        <p className={styles.notice} role="alert">
          {t('auth.invalidLink')}{' '}
          <Link to="/auth/sign-in">{t('auth.returnSignIn')}</Link>
        </p>
      )}
    </AuthShell>
  );
};
