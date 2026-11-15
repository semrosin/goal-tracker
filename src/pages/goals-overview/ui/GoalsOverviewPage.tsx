import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { filterGoals, normalizeGoalFilters } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { CreateGoalDialog } from '../../../features/create-goal';
import { formatMoney, type Currency } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import { Button } from '../../../shared/ui/Button/Button';
import { GoalsList } from '../../../widgets/goals-list';
import { AppHeader } from '../../../widgets/app-header';
import styles from './GoalsOverviewPage.module.scss';

export const GoalsOverviewPage = () => {
  const { locale, t } = useI18n();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const choices = normalizeGoalFilters({
    search: params.get('search') ?? '',
    status: params.get('status') ?? 'all',
    currency: params.get('currency') ?? 'all',
    deadline: params.get('deadline') ?? 'all',
    sort: params.get('sort') ?? 'original',
  });
  const setChoice = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (
      !value ||
      (key !== 'search' && (value === 'all' || value === 'original'))
    )
      next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const goals = useLedgerSelector((state) => state.goals);
  const transactions = useLedgerSelector((state) => state.transactions);
  const balances = goals.map((goal) => ({
    goal,
    balance: calculateBalance(goal.id, transactions),
  }));
  const filteredGoals = filterGoals(
    goals,
    new Map(balances.map(({ goal, balance }) => [goal.id, balance])),
    choices,
    locale
  );
  const totalSavings = new Map<Currency, number>();
  for (const { goal, balance } of balances) {
    const currency = goal.currency ?? 'RUB';
    totalSavings.set(currency, (totalSavings.get(currency) ?? 0) + balance);
  }
  if (totalSavings.size === 0) totalSavings.set('RUB', 0);
  const completedGoals = balances.filter(
    ({ goal, balance }) => balance >= goal.targetAmount
  ).length;
  const activeGoals = goals.length - completedGoals;

  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.page}>
        <section aria-label={t('overview.summary')} className={styles.summary}>
          <article
            aria-label={t('overview.total')}
            className={styles.totalCard}
          >
            <span>{t('overview.total')}</span>
            <div
              className={
                totalSavings.size > 1 ? styles.multipleTotals : undefined
              }
            >
              {Array.from(totalSavings).map(([currency, amount]) => (
                <strong key={currency}>
                  {formatMoney(amount, currency, locale)}
                </strong>
              ))}
            </div>
          </article>
          <article
            aria-label={t('overview.active')}
            className={styles.statCard}
          >
            <span>{t('overview.active')}</span>
            <strong>{activeGoals}</strong>
          </article>
          <article
            aria-label={t('overview.completed')}
            className={styles.statCard}
          >
            <span>{t('overview.completed')}</span>
            <strong className={styles.completedCount}>{completedGoals}</strong>
          </article>
        </section>
        <section aria-label={t('overview.goalList')} className={styles.content}>
          <div className={styles.sectionHeading}>
            <h1>{t('overview.title')}</h1>
            <Button
              className={styles.createButton}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus size={19} aria-hidden="true" />
              <span>{t('overview.create')}</span>
            </Button>
          </div>
          {goals.length > 0 ? (
            <>
              <div className={styles.filters}>
                <label>
                  {t('filters.search')}
                  <input
                    type="search"
                    value={choices.search}
                    onChange={(event) =>
                      setChoice('search', event.target.value)
                    }
                  />
                </label>
                {(['status', 'currency', 'deadline', 'sort'] as const).map(
                  (key) => (
                    <label key={key}>
                      {t(`filters.${key}`)}
                      <select
                        value={choices[key]}
                        onChange={(event) => setChoice(key, event.target.value)}
                      >
                        {(key === 'status'
                          ? ['all', 'active', 'completed']
                          : key === 'currency'
                            ? ['all', 'RUB', 'USD']
                            : key === 'deadline'
                              ? ['all', 'dated', 'none', 'overdue']
                              : ['original', 'deadline', 'progress', 'name']
                        ).map((value) => (
                          <option key={value} value={value}>
                            {t(
                              `filters.option.${value}` as
                                | 'filters.option.all'
                                | 'filters.option.active'
                                | 'filters.option.completed'
                                | 'filters.option.RUB'
                                | 'filters.option.USD'
                                | 'filters.option.dated'
                                | 'filters.option.none'
                                | 'filters.option.overdue'
                                | 'filters.option.original'
                                | 'filters.option.deadline'
                                | 'filters.option.progress'
                                | 'filters.option.name'
                            )}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                )}
              </div>
              {filteredGoals.length ? (
                <GoalsList goals={filteredGoals} />
              ) : (
                <div className={styles.emptyState}>
                  <p>{t('filters.empty')}</p>
                  <p>{t('filters.emptyHint')}</p>
                  <Button
                    variant="secondary"
                    onClick={() => setParams({}, { replace: true })}
                  >
                    {t('filters.reset')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>{t('overview.empty')}</p>
              <p>{t('overview.emptyHint')}</p>
            </div>
          )}
        </section>
      </main>
      <CreateGoalDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
};
