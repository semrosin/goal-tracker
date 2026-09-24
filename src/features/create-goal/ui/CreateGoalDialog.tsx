import { useState } from 'react';
import type { FormEvent } from 'react';

import { isValidTargetMonth } from '../../../entities/goal';
import { useLedgerCommands } from '../../../entities/ledger';
import { createTimestamp } from '../../../shared/lib/date';
import { createId } from '../../../shared/lib/id';
import { useI18n } from '../../../shared/lib/i18n';
import { isPositiveInteger } from '../../../shared/lib/validation';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';
import { Field } from '../../../shared/ui/Field/Field';
import styles from './CreateGoalDialog.module.scss';

type CreateGoalDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FormErrors = {
  title?: string;
  targetAmount?: string;
  targetMonth?: string;
};

export const CreateGoalDialog = ({
  isOpen,
  onClose,
}: CreateGoalDialogProps) => {
  const { createGoal, busy, error, clearError } = useLedgerCommands();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();

  const handleClose = () => {
    setSubmitError(undefined);
    clearError();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const amount = Number(targetAmount);
    const nextErrors: FormErrors = {
      title:
        normalizedTitle.length === 0
          ? t('goal.titleRequiredCreate')
          : undefined,
      targetAmount: isPositiveInteger(amount)
        ? undefined
        : t('goal.amountRequiredCreate'),
      targetMonth:
        targetMonth === '' || isValidTargetMonth(targetMonth)
          ? undefined
          : t('goal.monthInvalid'),
    };

    if (
      nextErrors.title !== undefined ||
      nextErrors.targetAmount !== undefined ||
      nextErrors.targetMonth !== undefined
    ) {
      setErrors(nextErrors);
      return;
    }

    setSubmitError(undefined);
    clearError();
    try {
      await createGoal({
        id: createId('goal'),
        title: normalizedTitle,
        description: description.trim(),
        targetAmount: amount,
        ...(targetMonth === '' ? {} : { targetMonth }),
        createdAt: createTimestamp(),
      });
    } catch {
      setSubmitError(t('goal.createError'));
      return;
    }
    setTitle('');
    setDescription('');
    setTargetAmount('');
    setTargetMonth('');
    setErrors({});
    handleClose();
  };

  return (
    <Dialog isOpen={isOpen} title={t('goal.createTitle')} onClose={handleClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Field
          error={errors.title}
          label={t('goal.titleLabel')}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <Field
          error={errors.targetAmount}
          inputMode="numeric"
          label={t('goal.amountLabel')}
          onChange={(event) => setTargetAmount(event.target.value)}
          value={targetAmount}
        />
        <Field
          error={errors.targetMonth}
          label={t('goal.monthLabel')}
          onChange={(event) => setTargetMonth(event.target.value)}
          type="month"
          value={targetMonth}
        />
        {(submitError ?? error) ? (
          <p className={styles.submitError} role="alert">
            {submitError ?? error}
          </p>
        ) : null}
        <div className={styles.descriptionField}>
          <label htmlFor="goal-description">{t('goal.descriptionLabel')}</label>
          <textarea
            className={styles.descriptionInput}
            id="goal-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('goal.descriptionPlaceholder')}
            rows={3}
            value={description}
          />
        </div>
        <Button
          className={styles.submitButton}
          disabled={busy}
          fullWidth
          type="submit"
        >
          {busy ? t('goal.saving') : t('goal.createAction')}
        </Button>
      </form>
    </Dialog>
  );
};
