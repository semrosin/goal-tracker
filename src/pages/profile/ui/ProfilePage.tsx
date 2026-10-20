import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import {
  calculateStatistics,
  useLedgerSelector,
} from '../../../entities/ledger';
import { useSession } from '../../../entities/session';
import { useI18n } from '../../../shared/lib/i18n';
import { formatMoney, type Currency } from '../../../shared/lib/money';
import { Button } from '../../../shared/ui/Button/Button';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import { AppHeader } from '../../../widgets/app-header';
import { AccountPanel } from './AccountPanel';
import { StatisticsCharts } from './StatisticsCharts';
import styles from './ProfilePage.module.scss';

export const ProfilePage = () => {
  const { locale, t } = useI18n();
  const session = useSession();
  const goals = useLedgerSelector((state) => state.goals);
  const transactions = useLedgerSelector((state) => state.transactions);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('RUB');
  const currencies = Array.from(
    new Set(goals.map((goal) => goal.currency ?? 'RUB'))
  );
  const currency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : (currencies[0] ?? 'RUB');
  const statistics = useMemo(
    () => calculateStatistics({ goals, transactions }, currency, new Date()),
    [goals, transactions, currency]
  );
  const money = (value: number) => formatMoney(value, currency, locale);
  const loading =
    session.mode === 'cloud' &&
    goals.length === 0 &&
    (session.ledgerStatus === 'idle' || session.ledgerStatus === 'loading');
  const failed = session.mode === 'cloud' && session.ledgerStatus === 'error';
  const metrics = [
    {
      label: t('overview.total'),
      value: money(statistics.saved),
      icon: Wallet,
      className: styles.savedCard,
    },
    {
      label: t('profile.deposits'),
      value: money(statistics.deposits),
      icon: ArrowDownLeft,
      className: styles.depositCard,
    },
    {
      label: t('profile.withdrawals'),
      value: money(statistics.withdrawals),
      icon: ArrowUpRight,
      className: styles.withdrawalCard,
    },
    {
      label: t('profile.transactions'),
      value: statistics.transactionCount.toLocaleString(locale),
      icon: ChartNoAxesCombined,
      className: '',
    },
  ];

  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.page}>
        <Link className={styles.backLink} to="/app">
          <ArrowLeft size={17} aria-hidden="true" />
          {t('detail.back')}
        </Link>
        <div className={styles.pageHeading}>
          {session.mode === 'demo' && (
            <span className={styles.demoBadge}>{t('profile.demo')}</span>
          )}
        </div>
        <div className={styles.layout}>
          <section
            className={styles.statistics}
            aria-label={t('profile.statistics')}
          >
            <div className={styles.statisticsHeading}>
              <div>
                <h2>{t('profile.statistics')}</h2>
                <p className={styles.hint}>{t('profile.currencyHint')}</p>
              </div>
              {currencies.length > 1 && (
                <div
                  className={styles.currencyPicker}
                  role="group"
                  aria-label={t('goal.currencyLabel')}
                >
                  {currencies.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={currency === item}
                      onClick={() => setSelectedCurrency(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading ? (
              <p className={styles.panel} role="status">
                {t('status.loadingGoals')}
              </p>
            ) : failed ? (
              <div className={styles.panel} role="alert">
                <h3>{t('status.loadError')}</h3>
                <p>{session.ledgerError}</p>
                <Button
                  variant="secondary"
                  onClick={() => void session.refresh()}
                >
                  {t('status.retry')}
                </Button>
              </div>
            ) : goals.length === 0 ? (
              <div className={`${styles.panel} ${styles.empty}`}>
                <ChartNoAxesCombined size={40} aria-hidden="true" />
                <h3>{t('profile.empty')}</h3>
                <p className={styles.hint}>{t('profile.emptyHint')}</p>
                <Link className={styles.backLink} to="/app">
                  {t('detail.back')}
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.metrics}>
                  {metrics.map(({ label, value, icon: Icon, className }) => (
                    <article
                      key={label}
                      aria-label={label}
                      className={`${styles.metric} ${className}`}
                    >
                      <div>
                        <span>{label}</span>
                        <Icon size={18} aria-hidden="true" />
                      </div>
                      <strong>{value}</strong>
                      <small>{t('profile.allTime', { currency })}</small>
                    </article>
                  ))}
                </div>
                {statistics.transactionCount === 0 && (
                  <p className={styles.hint}>{t('profile.noTransactions')}</p>
                )}
                <StatisticsCharts statistics={statistics} currency={currency} />
                <section
                  className={styles.panel}
                  aria-label={t('profile.progressChart')}
                >
                  <h3>{t('profile.progressChart')}</h3>
                  <p className={styles.hint}>
                    {t('profile.goalCounts', {
                      active: statistics.active,
                      completed: statistics.completed,
                    })}
                  </p>
                  <ul className={styles.goalProgress}>
                    {statistics.goalProgress.map((goal) => (
                      <li key={goal.id}>
                        <div className={styles.goalHeading}>
                          <Link to={`/goals/${goal.id}`}>{goal.title}</Link>
                          <strong>{Math.round(goal.progress)}%</strong>
                        </div>
                        <ProgressBar
                          value={goal.progress}
                          tone={goal.progress >= 100 ? 'success' : 'default'}
                          label={t('profile.progressLabel', {
                            title: goal.title,
                          })}
                        />
                        <p>
                          {money(goal.balance)} / {money(goal.targetAmount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </section>
          <AccountPanel />
        </div>
      </main>
    </div>
  );
};
