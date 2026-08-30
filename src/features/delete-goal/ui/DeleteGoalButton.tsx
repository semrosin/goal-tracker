import { useState } from 'react';

import { useAppDispatch } from '../../../app/store/hooks';
import { goalsActions } from '../../../entities/goal/model/goalSlice';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';

type DeleteGoalButtonProps = {
  goalId: string;
  onDeleted?: () => void;
};

export const DeleteGoalButton = ({
  goalId,
  onDeleted,
}: DeleteGoalButtonProps) => {
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirm = () => {
    dispatch(goalsActions.goalRemoved(goalId));
    setIsDialogOpen(false);
    onDeleted?.();
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} variant="danger">
        Удалить цель
      </Button>
      <Dialog
        isOpen={isDialogOpen}
        title="Удалить цель"
        onClose={() => setIsDialogOpen(false)}
      >
        <p>Цель и все связанные операции будут удалены.</p>
        <div>
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
