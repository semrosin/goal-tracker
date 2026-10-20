import { LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useSession } from '../../../entities/session';
import { useI18n } from '../../../shared/lib/i18n';
import { Button } from '../../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './ProfilePage.module.scss';

export const AccountPanel = () => {
  const { locale, t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const joined = session.createdAt ? new Date(session.createdAt) : null;

  const signOut = async () => {
    setError(false);
    setBusy(true);
    try {
      await session.signOut();
      navigate('/', { replace: true });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className={styles.account} aria-label={t('profile.account')}>
      <section className={styles.accountSection}>
        <div className={styles.accountIcon}>
          <UserRound size={26} aria-hidden="true" />
        </div>
        <h2>{t('profile.account')}</h2>
        {session.mode === 'demo' ? (
          <p className={styles.hint}>{t('profile.demoHint')}</p>
        ) : (
          <dl className={styles.accountData}>
            <div>
              <dt>{t('auth.email')}</dt>
              <dd>{session.email ?? '—'}</dd>
            </div>
            {joined && Number.isFinite(joined.getTime()) && (
              <div>
                <dt>{t('profile.createdAt')}</dt>
                <dd>
                  <time dateTime={session.createdAt}>
                    {new Intl.DateTimeFormat(
                      locale === 'ru' ? 'ru-RU' : 'en-US',
                      { dateStyle: 'long' }
                    ).format(joined)}
                  </time>
                </dd>
              </div>
            )}
            <div>
              <dt>{t('profile.storage')}</dt>
              <dd>{t('profile.cloud')}</dd>
            </div>
          </dl>
        )}
      </section>
      <section className={styles.accountSection}>
        <h2>{t('profile.settings')}</h2>
        <div className={styles.languageRow}>
          <span>{t('language.label')}</span>
          <LanguageSwitcher />
        </div>
      </section>
      <div className={styles.accountSection}>
        {session.mode === 'demo' ? (
          <div className={styles.demoActions}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (window.confirm(t('toolbar.resetPrompt')))
                  session.resetDemo();
              }}
            >
              {t('toolbar.reset')}
            </Button>
            <Link className={styles.backLink} to="/">
              {t('toolbar.home')}
            </Link>
          </div>
        ) : (
          <Button
            variant="danger"
            fullWidth
            disabled={busy}
            onClick={() => void signOut()}
          >
            <LogOut size={18} aria-hidden="true" />
            {busy ? t('profile.signingOut') : t('toolbar.signOut')}
          </Button>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {t('toolbar.signOutError')}
          </p>
        )}
      </div>
    </aside>
  );
};
