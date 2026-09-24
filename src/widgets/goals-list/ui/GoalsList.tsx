import { Link } from 'react-router';

import { calculateProgress } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatRubles } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './GoalsList.module.scss';

export const GoalsList = () => {
  const { locale, t } = useI18n();
  const goals = useLedgerSelector((state) => state.goals);
  const transactions = useLedgerSelector((state) => state.transactions);

  return (
    <div className={styles.list}>
      {goals.map((goal) => {
        const balance = calculateBalance(goal.id, transactions);
        const progress = calculateProgress(balance, goal.targetAmount);
        const isCompleted = balance >= goal.targetAmount;

        return (
          <Link
            key={goal.id}
            className={`${styles.card} ${styles.gridCard} ${isCompleted ? styles.completedCard : ''}`}
            to={`/goals/${goal.id}`}
          >
            <div className={styles.cardHeader}>
              <h2>{goal.title}</h2>
              {isCompleted ? (
                <span className={styles.status}>{t('list.completed')}</span>
              ) : null}
            </div>
            <p>{progress.toFixed(0)}%</p>
            <ProgressBar
              label={t('goal.progressLabel', { title: goal.title })}
              tone={isCompleted ? 'light' : 'default'}
              value={progress}
            />
            <p>
              {formatRubles(balance, locale)} /{' '}
              {formatRubles(goal.targetAmount, locale)}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
