import {
  ArrowRight,
  CalendarClock,
  Cloud,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useI18n } from '../../../shared/lib/i18n';
import { publicAsset } from '../../../shared/lib/publicPath';
import { Button } from '../../../shared/ui/Button/Button';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './WelcomePage.module.scss';
import { DotBackdrop } from '../../../shared/ui/DotBackdrop/DotBackdrop';

type WelcomePageProps = {
  onSignUp: () => void;
  onSignIn: () => void;
};

type Feature = {
  icon: ReactNode;
  title: string;
  text: string;
};

export const WelcomePage = ({ onSignUp, onSignIn }: WelcomePageProps) => {
  const { t } = useI18n();

  const features: Feature[] = [
    {
      icon: <Target aria-hidden="true" size={22} />,
      title: t('welcome.featureGoals'),
      text: t('welcome.featureGoalsText'),
    },
    {
      icon: <Wallet aria-hidden="true" size={22} />,
      title: t('welcome.featureHistory'),
      text: t('welcome.featureHistoryText'),
    },
    {
      icon: <CalendarClock aria-hidden="true" size={22} />,
      title: t('welcome.featurePlan'),
      text: t('welcome.featurePlanText'),
    },
    {
      icon: <TrendingUp aria-hidden="true" size={22} />,
      title: t('welcome.featureForecast'),
      text: t('welcome.featureForecastText'),
    },
    {
      icon: <Cloud aria-hidden="true" size={22} />,
      title: t('welcome.featureSync'),
      text: t('welcome.featureSyncText'),
    },
    {
      icon: <ShieldCheck aria-hidden="true" size={22} />,
      title: t('welcome.featurePrivacy'),
      text: t('welcome.featurePrivacyText'),
    },
  ];

  const steps = [
    { title: t('welcome.stepCreate'), text: t('welcome.stepCreateText') },
    { title: t('welcome.stepGoal'), text: t('welcome.stepGoalText') },
    { title: t('welcome.stepTrack'), text: t('welcome.stepTrackText') },
  ];

  return (
    <div className={styles.shell}>
      <DotBackdrop />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img alt="" height={40} src={publicAsset('logo.svg')} width={40} />
            <span>GoalCraft</span>
          </div>
          <div className={styles.headerActions}>
            <LanguageSwitcher />
            <Button onClick={onSignIn} variant="secondary">
              {t('welcome.signIn')}
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section aria-labelledby="welcome-title" className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 id="welcome-title">{t('welcome.title')}</h1>
            <p className={styles.lead}>{t('welcome.lead')}</p>
            <div className={styles.heroCta}>
              <div className={styles.actions}>
                <Button className={styles.primaryAction} onClick={onSignUp}>
                  {t('auth.createAccount')}{' '}
                  <ArrowRight aria-hidden="true" size={18} />
                </Button>
                <Button onClick={onSignIn} variant="secondary">
                  {t('welcome.signIn')}
                </Button>
              </div>
              <p className={styles.hint}>{t('welcome.heroHint')}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="welcome-features" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 id="welcome-features">{t('welcome.featuresTitle')}</h2>
            <p>{t('welcome.featuresLead')}</p>
          </div>
          <ul className={styles.features}>
            {features.map((feature) => (
              <li className={styles.featureCard} key={feature.title}>
                <span aria-hidden="true" className={styles.cornerMarks}>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="welcome-steps" className={styles.stepsBand}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 id="welcome-steps">{t('welcome.stepsTitle')}</h2>
            </div>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li className={styles.step} key={step.title}>
                  <span aria-hidden="true" className={styles.stepNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.ctaPanel}>
            <h2>{t('welcome.ctaTitle')}</h2>
            <p>{t('welcome.ctaLead')}</p>
            <div className={styles.actions}>
              <Button className={styles.primaryAction} onClick={onSignUp}>
                {t('welcome.ctaAction')}{' '}
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>{t('welcome.footer')}</span>
        </div>
      </footer>
    </div>
  );
};
