import { Link } from 'react-router';

import { calculateProgress } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatRubles } from '../../../shared/lib/money';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './GoalsList.module.scss';

export const GoalsList = () => {
  const goals = useLedgerSelector((state) => state.goals);
  const transactions = useLedgerSelector((state) => state.transactions);

  return (
    <div className={styles.list}>
      {goals.map((goal, index) => {
        const balance = calculateBalance(goal.id, transactions);
        const progress = calculateProgress(balance, goal.targetAmount);
        const isCompleted = balance >= goal.targetAmount;
        const isGradient = index % 3 === 0;
        const visualStyle = isGradient ? styles.gradientCard : styles.gridCard;

        return (
          <Link
            key={goal.id}
            className={`${styles.card} ${visualStyle} ${isCompleted ? styles.completedCard : ''}`}
            to={`/goals/${goal.id}`}
          >
            <div className={styles.cardHeader}>
              <h2>{goal.title}</h2>
              {isCompleted ? (
                <span className={styles.status}>Выполнено</span>
              ) : null}
            </div>
            <p>{progress.toFixed(0)}%</p>
            <ProgressBar
              label={`Прогресс цели ${goal.title}`}
              tone={isGradient ? 'light' : isCompleted ? 'success' : 'default'}
              value={progress}
            />
            <p>
              {formatRubles(balance)} / {formatRubles(goal.targetAmount)}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
