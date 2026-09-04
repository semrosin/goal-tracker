import { useState } from 'react';
import type { FormEvent } from 'react';

import { goalsActions } from '../../../entities/goal';
import { useLedgerDispatch } from '../../../entities/ledger';
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
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const amount = Number(targetAmount);
    const nextErrors: FormErrors = {
      title: normalizedTitle.length === 0 ? 'Укажите название цели' : undefined,
      targetAmount: isPositiveInteger(amount)
        ? undefined
        : 'Сумма должна быть положительным целым числом',
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
        description: description.trim(),
        targetAmount: amount,
        createdAt: createTimestamp(),
      })
    );
    setTitle('');
    setDescription('');
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
          label="Сумма"
          onChange={(event) => setTargetAmount(event.target.value)}
          value={targetAmount}
        />
        <div className={styles.descriptionField}>
          <label htmlFor="goal-description">Описание</label>
          <textarea
            className={styles.descriptionInput}
            id="goal-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Напишите, зачем вам эта цель и о чём вы мечтаете"
            rows={3}
            value={description}
          />
        </div>
        <Button className={styles.submitButton} fullWidth type="submit">
          Создать
        </Button>
      </form>
    </Dialog>
  );
};
