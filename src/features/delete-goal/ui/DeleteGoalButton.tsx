import { useState } from 'react';

import { goalsActions } from '../../../entities/goal';
import { useLedgerDispatch } from '../../../entities/ledger';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';
import styles from './DeleteGoalButton.module.scss';

type DeleteGoalButtonProps = {
  goalId: string;
  onDeleted?: () => void;
};

export const DeleteGoalButton = ({
  goalId,
  onDeleted,
}: DeleteGoalButtonProps) => {
  const dispatch = useLedgerDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirm = () => {
    dispatch(goalsActions.goalRemoved(goalId));
    setIsDialogOpen(false);
    onDeleted?.();
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} variant="danger">
        Удалить
      </Button>
      <Dialog
        isOpen={isDialogOpen}
        title="Удалить"
        onClose={() => setIsDialogOpen(false)}
      >
        <p>Цель и все связанные операции будут удалены.</p>
        <div className={styles.actions}>
          <Button onClick={() => setIsDialogOpen(false)} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleConfirm} variant="danger">
            Удалить
          </Button>
        </div>
      </Dialog>
    </>
  );
};
