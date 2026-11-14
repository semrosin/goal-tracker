import { calculateProgress, type Goal } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { formatMoney } from '../../../shared/lib/money';
import { useI18n } from '../../../shared/lib/i18n';
import styles from './GoalSummary.module.scss';

type GoalSummaryProps = {
  goal: Goal;
  isCompleted?: boolean;
};

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
      data-color={goal.color ?? 'violet'}
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
          <div>
            <span>{t('goal.remaining')}</span>
            <strong>
              {formatMoney(
                Math.max(0, goal.targetAmount - balance),
                goal.currency,
                locale
              )}
            </strong>
          </div>
        </div>
        <div className={styles.progressSection}>
          <div className={styles.progressHeading}>
            <span>{t('goal.progress')}</span>
            <strong>{progress}%</strong>
          </div>
          <div
            aria-label={t('goal.progressLabel', { title: goal.title })}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className={styles.progress}
            role="progressbar"
          >
            <div className={styles.value} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};
