import { useState } from 'react';

import { useAppDispatch } from '../../../app/store/hooks';
import { transactionsActions } from '../../../entities/transaction/model/transactionSlice';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';

type DeleteTransactionButtonProps = { transactionId: string };

export const DeleteTransactionButton = ({
  transactionId,
}: DeleteTransactionButtonProps) => {
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handleConfirm = () => {
    dispatch(transactionsActions.transactionRemoved(transactionId));
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        aria-label="Удалить операцию"
        onClick={() => setIsDialogOpen(true)}
        variant="danger"
      >
        Удалить
      </Button>
      <Dialog
        isOpen={isDialogOpen}
        title="Удалить операцию"
        onClose={() => setIsDialogOpen(false)}
      >
        <p>Операция будет удалена без возможности восстановления.</p>
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
