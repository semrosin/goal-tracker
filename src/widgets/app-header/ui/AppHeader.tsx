import { LogOut } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { useSession } from '../../../entities/session';
import { useI18n } from '../../../shared/lib/i18n';
import { publicAsset } from '../../../shared/lib/publicPath';
import { Button } from '../../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './AppHeader.module.scss';

export const AppHeader = ({ children }: { children?: ReactNode }) => {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await session.signOut();
      navigate('/', { replace: true });
    } catch {
      setError(t('toolbar.signOutError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link
          className={styles.brand}
          to="/app"
          aria-label={t('overview.title')}
        >
          <img
            src={publicAsset('logo.svg')}
            alt={t('overview.logo')}
            width={44}
            height={44}
          />
        </Link>
        <div className={styles.actions}>
          <LanguageSwitcher />
          {children}
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
            <button
              className={styles.signOut}
              type="button"
              aria-label={t('toolbar.signOut')}
              title={t('toolbar.signOut')}
              disabled={busy}
              onClick={() => void signOut()}
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </header>
  );
};
