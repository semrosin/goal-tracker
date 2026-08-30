import { Link } from 'react-router';

import { useAppSelector } from '../../../app/store/hooks';
import { calculateProgress } from '../../../entities/goal/model/selectors';
import { calculateBalance } from '../../../entities/transaction/model/selectors';
import { formatRubles } from '../../../shared/lib/money';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './GoalsList.module.scss';

export const GoalsList = () => {
  const goals = useAppSelector((state) => state.goals);
  const transactions = useAppSelector((state) => state.transactions);

  return (
    <div className={styles.list}>
      {goals.map((goal) => {
        const balance = calculateBalance(goal.id, transactions);
        const progress = calculateProgress(balance, goal.targetAmount);

        return (
          <Link key={goal.id} className={styles.card} to={`/goals/${goal.id}`}>
            <h2>{goal.title}</h2>
            <p>{progress.toFixed(0)}%</p>
            <ProgressBar
              label={`Прогресс цели ${goal.title}`}
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
