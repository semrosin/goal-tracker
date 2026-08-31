import { useState } from 'react';

import {
  hasNonNegativeBalancePrefixes,
  useLedgerDispatch,
  useLedgerSelector,
} from '../../../entities/ledger';
import { transactionsActions } from '../../../entities/transaction';
import { Button } from '../../../shared/ui/Button/Button';
import { Dialog } from '../../../shared/ui/Dialog/Dialog';
import styles from './DeleteTransactionButton.module.scss';

type DeleteTransactionButtonProps = {
  transactionId: string;
  ariaLabel: string;
};

export const DeleteTransactionButton = ({
  ariaLabel,
  transactionId,
}: DeleteTransactionButtonProps) => {
  const dispatch = useLedgerDispatch();
  const transactions = useLedgerSelector((state) => state.transactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeletionBlocked, setIsDeletionBlocked] = useState(false);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsDeletionBlocked(false);
  };

  const openDialog = () => {
    setIsDeletionBlocked(false);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    const remainingTransactions = transactions.filter(
      (transaction) => transaction.id !== transactionId
    );
    if (!hasNonNegativeBalancePrefixes(remainingTransactions)) {
      setIsDeletionBlocked(true);
      return;
    }

    dispatch(transactionsActions.transactionRemoved(transactionId));
    closeDialog();
  };

  return (
    <>
      <Button aria-label={ariaLabel} onClick={openDialog} variant="danger">
        Удалить
      </Button>
      <Dialog
        isOpen={isDialogOpen}
        title="Удалить операцию"
        onClose={closeDialog}
      >
        <p>Операция будет удалена без возможности восстановления.</p>
        {isDeletionBlocked && (
          <p className={styles.error} role="alert">
            Нельзя удалить операцию: это приведёт к отрицательному балансу
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={closeDialog} variant="secondary">
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
