import { useState } from 'react';

import {
  calculateGoalPlan,
  forecastCompletionMonth,
  getCurrentMonth,
  type Goal,
  type GoalPlan,
} from '../../../entities/goal';
import { formatRubles } from '../../../shared/lib/money';
import { useI18n, type Locale } from '../../../shared/lib/i18n';
import { Field } from '../../../shared/ui/Field/Field';
import styles from './SavingsPlan.module.scss';

type SavingsPlanProps = { goal: Goal; balance: number };

const statusKeys: Record<
  GoalPlan['status'],
  'plan.active' | 'plan.overdue' | 'plan.completed' | 'plan.noDeadline'
> = {
  active: 'plan.active',
  overdue: 'plan.overdue',
  completed: 'plan.completed',
  'without-deadline': 'plan.noDeadline',
};

const monthFormatters: Record<Locale, Intl.DateTimeFormat> = {
  ru: new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }),
};

const formatMonth = (month: string, locale: Locale): string => {
  const date = new Date(0);
  date.setFullYear(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
  return monthFormatters[locale].format(date);
};

export const SavingsPlan = ({ goal, balance }: SavingsPlanProps) => {
  const { locale, t } = useI18n();
  const [contribution, setContribution] = useState('');
  const currentMonth = getCurrentMonth();
  const plan = calculateGoalPlan(
    goal.targetAmount,
    balance,
    goal.targetMonth,
    currentMonth
  );
  const forecast = forecastCompletionMonth(
    plan.remaining,
    Number(contribution),
    currentMonth
  );

  return (
    <div className={styles.plan}>
      <div className={styles.heading}>
        <h3>{t('plan.title')}</h3>
        <span className={`${styles.status} ${styles[plan.status] ?? ''}`}>
          {t(statusKeys[plan.status])}
        </span>
      </div>

      {goal.targetMonth === undefined ? null : (
        <p className={styles.target}>
          {t('plan.targetMonth', {
            month: formatMonth(goal.targetMonth, locale),
          })}
        </p>
      )}

      {plan.status === 'active' ? (
        <p className={styles.contribution}>
          {t('plan.monthlyContribution', {
            amount: formatRubles(plan.monthlyContribution, locale),
          })}
        </p>
      ) : null}
      {plan.status === 'overdue' ? (
        <p className={styles.note}>{t('plan.overdueHint')}</p>
      ) : null}
      {plan.status === 'without-deadline' ? (
        <p className={styles.note}>{t('plan.noDeadlineHint')}</p>
      ) : null}

      {plan.status === 'completed' ? null : (
        <div className={styles.calculator}>
          <Field
            inputMode="numeric"
            label={t('plan.whatIfLabel')}
            onChange={(event) => setContribution(event.target.value)}
            placeholder={t('plan.whatIfPlaceholder')}
            value={contribution}
          />
          <p aria-live="polite" className={styles.forecast}>
            {forecast === undefined
              ? t('plan.whatIfHint')
              : t('plan.forecast', { month: formatMonth(forecast, locale) })}
          </p>
        </div>
      )}
    </div>
  );
};
