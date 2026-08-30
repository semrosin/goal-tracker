import { useState } from 'react';
import type { FormEvent } from 'react';

import { useLedgerDispatch } from '../../../entities/ledger';
import { goalsActions } from '../../../entities/goal/model/goalSlice';
import { createTimestamp } from '../../../shared/lib/date';
import { createId } from '../../../shared/lib/id';
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
};

export const CreateGoalDialog = ({
  isOpen,
  onClose,
}: CreateGoalDialogProps) => {
  const dispatch = useLedgerDispatch();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const amount = Number(targetAmount);
    const nextErrors: FormErrors = {
      title: normalizedTitle.length === 0 ? 'Введите название цели' : undefined,
      targetAmount: isPositiveInteger(amount)
        ? undefined
        : 'Укажите положительную целую сумму',
    };

    if (
      nextErrors.title !== undefined ||
      nextErrors.targetAmount !== undefined
    ) {
      setErrors(nextErrors);
      return;
    }

    dispatch(
      goalsActions.goalCreated({
        id: createId('goal'),
        title: normalizedTitle,
        targetAmount: amount,
        createdAt: createTimestamp(),
      })
    );
    setTitle('');
    setTargetAmount('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} title="Новая цель" onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Field
          error={errors.title}
          label="Название"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <Field
          error={errors.targetAmount}
          inputMode="numeric"
          label="Целевая сумма"
          onChange={(event) => setTargetAmount(event.target.value)}
          value={targetAmount}
        />
        <Button className={styles.submitButton} fullWidth type="submit">
          Создать
        </Button>
      </form>
    </Dialog>
  );
};
