import { calculateProgress, type Goal } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatRubles } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import { ProgressBar } from '../../../shared/ui/ProgressBar/ProgressBar';
import { SavingsPlan } from './SavingsPlan';
import styles from './GoalSummary.module.scss';

type GoalSummaryProps = { goal: Goal; isCompleted?: boolean };

export const GoalSummary = ({
  goal,
  isCompleted = false,
}: GoalSummaryProps) => {
  const { locale, t } = useI18n();
  const balance = useLedgerSelector((state) =>
    calculateBalance(goal.id, state.transactions)
  );
  const progress = Math.round(calculateProgress(balance, goal.targetAmount));
  return (
    <section
      aria-labelledby="goal-summary-title"
      className={`${styles.summary} ${
        isCompleted || balance >= goal.targetAmount
          ? styles.completedSurface
          : styles.activeSurface
      }`}
    >
      <div className={styles.info}>
        <h2 id="goal-summary-title">{t('goal.summaryTitle')}</h2>
        {goal.description?.trim() === '' ||
        goal.description === undefined ? null : (
          <p className={styles.description}>{goal.description}</p>
        )}
      </div>
      <div className={styles.state}>
        <div className={styles.amounts}>
          <div>
            <span>{t('goal.saved')}</span>
            <strong>{formatRubles(balance, locale)}</strong>
          </div>
          <div>
            <span>{t('goal.target')}</span>
            <strong>{formatRubles(goal.targetAmount, locale)}</strong>
          </div>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressHeader}>
            <span>{t('goal.progress')}</span>
            <strong>{progress}%</strong>
          </div>
          <ProgressBar
            label={t('goal.progressLabel', { title: goal.title })}
            value={progress}
          />
        </div>
        <SavingsPlan balance={balance} goal={goal} />
      </div>
    </section>
  );
};
