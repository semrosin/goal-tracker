import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { goalsActions, type Goal } from '../../../entities/goal';
import { useLedgerDispatch } from '../../../entities/ledger';
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

export const EditGoalDialog = ({
  goal,
  isOpen,
  onClose,
}: EditGoalDialogProps) => {
  const dispatch = useLedgerDispatch();
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? '');
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [errors, setErrors] = useState<FormErrors>({});

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
    setErrors({});
  }, [goal, isOpen]);

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
      goalsActions.goalUpdated({
        id: goal.id,
        title: normalizedTitle,
        description: description.trim(),
        targetAmount: amount,
      })
    );
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} title="Изменить" onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Field
          error={errors.title}
          label="Название"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
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
        <Field
          error={errors.targetAmount}
          inputMode="numeric"
          label="Сумма"
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
