import { ArrowRight } from 'lucide-react';

import { useI18n } from '../../../shared/lib/i18n';
import { publicAsset } from '../../../shared/lib/publicPath';
import { Button } from '../../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './WelcomePage.module.scss';

type WelcomePageProps = {
  onSignUp: () => void;
  onSignIn: () => void;
};

export const WelcomePage = ({ onSignUp, onSignIn }: WelcomePageProps) => {
  const { t } = useI18n();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={publicAsset('logo.svg')} alt="" width={40} height={40} />
          <span>Goal Tracker</span>
        </div>
        <div className={styles.headerActions}>
          <LanguageSwitcher />
          <Button onClick={onSignIn} variant="secondary">
            {t('welcome.signIn')}
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1>{t('welcome.title')}</h1>
          <p className={styles.lead}>{t('welcome.lead')}</p>
          <div className={styles.actions}>
            <Button onClick={onSignUp}>
              {t('auth.createAccount')}{' '}
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
