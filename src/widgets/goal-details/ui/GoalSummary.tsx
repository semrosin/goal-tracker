import { calculateProgress, type Goal } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatRubles } from '../../../shared/lib/money';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import styles from './GoalSummary.module.scss';

type GoalSummaryProps = { goal: Goal };

export const GoalSummary = ({ goal }: GoalSummaryProps) => {
  const balance = useLedgerSelector((state) =>
    calculateBalance(goal.id, state.transactions)
  );
  const progress = Math.round(calculateProgress(balance, goal.targetAmount));
  return (
    <section aria-labelledby="goal-summary-title" className={styles.summary}>
      <h2 id="goal-summary-title">Состояние цели</h2>
      <div className={styles.amounts}>
        <div>
          <span>Накоплено</span>
          <strong>{formatRubles(balance)}</strong>
        </div>
        <div>
          <span>Цель</span>
          <strong>{formatRubles(goal.targetAmount)}</strong>
        </div>
      </div>
      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span>Прогресс</span>
          <strong>{progress}%</strong>
        </div>
        <ProgressBar label={`Прогресс цели ${goal.title}`} value={progress} />
      </div>
    </section>
  );
};
