import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { CreateGoalDialog } from '../../../features/create-goal';
import { formatRubles } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import { Button } from '../../../shared/ui/Button/Button';
import { GoalsList } from '../../../widgets/goals-list';
import styles from './GoalsOverviewPage.module.scss';

export const GoalsOverviewPage = () => {
  const { locale, t } = useI18n();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const goals = useLedgerSelector((state) => state.goals);
  const transactions = useLedgerSelector((state) => state.transactions);
  const balances = goals.map((goal) => ({
    goal,
    balance: calculateBalance(goal.id, transactions),
  }));
  const totalSavings = balances.reduce(
    (total, { balance }) => total + balance,
    0
  );
  const completedGoals = balances.filter(
    ({ goal, balance }) => balance >= goal.targetAmount
  ).length;
  const activeGoals = goals.length - completedGoals;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <img
            className={styles.logoSlot}
            src="/logo.svg"
            alt={t('overview.logo')}
            width={48}
            height={48}
          />
          <Button
            className={styles.createButton}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus size={18} />
            <span>{t('overview.create')}</span>
          </Button>
        </div>
      </header>
      <main className={styles.page}>
        <section aria-label={t('overview.summary')} className={styles.summary}>
          <article
            aria-label={t('overview.total')}
            className={styles.totalCard}
          >
            <span>{t('overview.total')}</span>
            <strong>{formatRubles(totalSavings, locale)}</strong>
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
          <h1>{t('overview.title')}</h1>
          {goals.length > 0 ? (
            <GoalsList />
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
