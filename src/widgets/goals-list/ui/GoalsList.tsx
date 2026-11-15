import { ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { calculateProgress, GoalIcon, type Goal } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatMoney } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './GoalsList.module.scss';

export const GoalsList = ({ goals: visibleGoals }: { goals?: Goal[] }) => {
  const { locale, t } = useI18n();
  const allGoals = useLedgerSelector((state) => state.goals);
  const goals = visibleGoals ?? allGoals;
  const { search } = useLocation();
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
            className={`${styles.card} ${isCompleted ? styles.completedCard : ''}`}
            data-color={goal.color ?? 'violet'}
            to={`/goals/${goal.id}${search}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.identity}>
                <span className={styles.goalIcon}>
                  <GoalIcon name={goal.icon} />
                </span>
                <h2>{goal.title}</h2>
              </div>
              {isCompleted ? (
                <span className={styles.status}>{t('list.completed')}</span>
              ) : (
                <ArrowUpRight
                  className={styles.arrow}
                  size={20}
                  aria-hidden="true"
                />
              )}
            </div>
            <p>{progress.toFixed(0)}%</p>
            <ProgressBar
              label={t('goal.progressLabel', { title: goal.title })}
              tone={isCompleted ? 'success' : 'default'}
              value={progress}
            />
            <p>
              {formatMoney(balance, goal.currency, locale)} /{' '}
              {formatMoney(goal.targetAmount, goal.currency, locale)}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
