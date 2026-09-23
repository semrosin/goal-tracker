import { ArrowRight, ChartNoAxesCombined, ShieldCheck } from 'lucide-react';

import { useI18n } from '../../../shared/lib/i18n';
import { formatRubles } from '../../../shared/lib/money';
import { Button } from '../../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './WelcomePage.module.scss';

type WelcomePageProps = {
  onOpenDemo: () => void;
  onSignIn: () => void;
};

export const WelcomePage = ({ onOpenDemo, onSignIn }: WelcomePageProps) => {
  const { locale, t } = useI18n();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" width={40} height={40} />
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
            <Button className={styles.demoButton} onClick={onOpenDemo}>
              {t('welcome.demo')} <ArrowRight aria-hidden="true" size={18} />
            </Button>
            <p>{t('welcome.noRegistration')}</p>
          </div>
        </div>

        <div aria-label={t('welcome.previewLabel')} className={styles.preview}>
          <div className={styles.previewTop}>
            <span className={styles.previewIcon}>
              <ChartNoAxesCombined aria-hidden="true" size={22} />
            </span>
            <span>{t('welcome.exampleGoal')}</span>
          </div>
          <h2>{t('welcome.exampleTitle')}</h2>
          <div className={styles.previewNumbers}>
            <strong>{formatRubles(84_000, locale)}</strong>
            <span>
              {t('welcome.ofTarget', { amount: formatRubles(200_000, locale) })}
            </span>
          </div>
          <ProgressBar label={t('welcome.progressLabel')} value={42} />
          <div className={styles.previewFooter}>
            <ShieldCheck aria-hidden="true" size={18} />
            <span>{t('welcome.exampleProgress')}</span>
          </div>
        </div>
      </main>
    </div>
  );
};
