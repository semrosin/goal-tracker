import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { CreateGoalDialog } from '../../../features/create-goal';
import { formatRubles } from '../../../shared/lib/money';
import { Button } from '../../../shared/ui/Button/Button';
import { GoalsList } from '../../../widgets/goals-list';
import styles from './GoalsOverviewPage.module.scss';

export const GoalsOverviewPage = () => {
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
          <div aria-label="Логотип" className={styles.logoSlot} role="img" />
          <Button
            className={styles.createButton}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus size={18} />
            <span>Новая цель</span>
          </Button>
        </div>
      </header>
      <main className={styles.page}>
        <section aria-label="Сводка накоплений" className={styles.summary}>
          <article aria-label="Всего накоплено" className={styles.totalCard}>
            <span>Всего накоплено</span>
            <strong>{formatRubles(totalSavings)}</strong>
          </article>
          <article aria-label="Активных целей" className={styles.statCard}>
            <span>Активных целей</span>
            <strong>{activeGoals}</strong>
          </article>
          <article aria-label="Закрытых целей" className={styles.statCard}>
            <span>Закрытых целей</span>
            <strong className={styles.completedCount}>{completedGoals}</strong>
          </article>
        </section>
        <section aria-label="Список целей" className={styles.content}>
          <h1>Мои цели</h1>
          {goals.length > 0 ? (
            <GoalsList />
          ) : (
            <p className={styles.emptyState}>Пока нет целей</p>
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
