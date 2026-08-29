import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { useAppDispatch } from '../../../app/store/hooks';
import { goalsActions } from '../../../entities/goal/model/goalSlice';
import type { Goal } from '../../../entities/goal/model/types';
import { isPositiveInteger } from '../../../shared/lib/validation';
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
};

export const EditGoalDialog = ({ goal, isOpen, onClose }: EditGoalDialogProps) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(goal.title);
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) return;

    setTitle(goal.title);
    setTargetAmount(String(goal.targetAmount));
    setErrors({});
  }, [goal, isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const amount = Number(targetAmount);
    const nextErrors: FormErrors = {
      title: normalizedTitle.length === 0 ? 'Введите название цели' : undefined,
      targetAmount: isPositiveInteger(amount) ? undefined : 'Укажите положительную целую сумму',
    };

    if (nextErrors.title !== undefined || nextErrors.targetAmount !== undefined) {
      setErrors(nextErrors);
      return;
    }

    dispatch(goalsActions.goalUpdated({ id: goal.id, title: normalizedTitle, targetAmount: amount }));
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} title="Изменить цель" onClose={onClose}>
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
          Сохранить
        </Button>
      </form>
    </Dialog>
  );
};
