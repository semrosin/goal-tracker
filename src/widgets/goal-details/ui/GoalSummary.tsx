import { calculateProgress, type Goal } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatMoney } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
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
      aria-label={goal.title}
      className={`${styles.summary} ${
        isCompleted || balance >= goal.targetAmount
          ? styles.completedSurface
          : styles.activeSurface
      }`}
    >
      <div className={styles.info}>
        {goal.description?.trim() === '' ||
        goal.description === undefined ? null : (
          <p className={styles.description}>{goal.description}</p>
        )}
      </div>
      <div className={styles.state}>
        <div className={styles.amounts}>
          <div>
            <span>{t('goal.saved')}</span>
            <strong>{formatMoney(balance, goal.currency, locale)}</strong>
          </div>
          <div>
            <span>{t('goal.target')}</span>
            <strong>
              {formatMoney(goal.targetAmount, goal.currency, locale)}
            </strong>
          </div>
        </div>
        <div
          aria-label={t('goal.progressLabel', { title: goal.title })}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className={styles.progress}
          role="progressbar"
        >
          <svg aria-hidden="true" viewBox="0 0 120 120">
            <circle className={styles.track} cx="60" cy="60" r="52" />
            {progress > 0 ? (
              <circle
                className={styles.value}
                cx="60"
                cy="60"
                r="52"
                pathLength="100"
                strokeDasharray={`${progress} 100`}
              />
            ) : null}
          </svg>
          <strong>{progress}%</strong>
        </div>
        <SavingsPlan balance={balance} goal={goal} />
      </div>
    </section>
  );
};
