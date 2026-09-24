import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { isValidTargetMonth, type Goal } from '../../../entities/goal';
import { useLedgerCommands } from '../../../entities/ledger';
import { isPositiveInteger } from '../../../shared/lib/validation';
import { useI18n } from '../../../shared/lib/i18n';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';
import { Field } from '../../../shared/ui/Field/Field';
import styles from './EditGoalDialog.module.scss';

type EditGoalDialogProps = {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
};

type FormErrors = {
  title?: string;
  targetAmount?: string;
  targetMonth?: string;
};

export const EditGoalDialog = ({
  goal,
  isOpen,
  onClose,
}: EditGoalDialogProps) => {
  const { updateGoal, busy, error, clearError } = useLedgerCommands();
  const { t } = useI18n();
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? '');
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [targetMonth, setTargetMonth] = useState(goal.targetMonth ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();

  const handleClose = () => {
    setSubmitError(undefined);
    clearError();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset the editable draft whenever this dialog opens for the supplied goal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(goal.title);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescription(goal.description ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetAmount(String(goal.targetAmount));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetMonth(goal.targetMonth ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors({});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitError(undefined);
  }, [goal, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const amount = Number(targetAmount);
    const nextErrors: FormErrors = {
      title:
        normalizedTitle.length === 0 ? t('goal.titleRequiredEdit') : undefined,
      targetAmount: isPositiveInteger(amount)
        ? undefined
        : t('goal.amountRequiredEdit'),
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
      await updateGoal({
        id: goal.id,
        title: normalizedTitle,
        description: description.trim(),
        targetAmount: amount,
        ...(targetMonth === '' ? {} : { targetMonth }),
      });
    } catch {
      setSubmitError(t('goal.saveError'));
      return;
    }
    handleClose();
  };

  return (
    <Dialog isOpen={isOpen} title={t('goal.editTitle')} onClose={handleClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Field
          error={errors.title}
          label={t('goal.titleLabel')}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
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
        <Button
          className={styles.submitButton}
          disabled={busy}
          fullWidth
          type="submit"
        >
          {busy ? t('goal.saving') : t('goal.saveAction')}
        </Button>
      </form>
    </Dialog>
  );
};
