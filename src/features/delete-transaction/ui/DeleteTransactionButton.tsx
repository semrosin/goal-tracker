import { Trash } from 'lucide-react';
import { useState } from 'react';

import {
  hasNonNegativeBalancePrefixes,
  useLedgerCommands,
  useLedgerSelector,
} from '../../../entities/ledger';
import { Button } from '../../../shared/ui/Button/Button';
import { useI18n } from '../../../shared/lib/i18n';
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
  const { t } = useI18n();
  const commands = useLedgerCommands();
  const transactions = useLedgerSelector((state) => state.transactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeletionBlocked, setIsDeletionBlocked] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsDeletionBlocked(false);
    setServerError(undefined);
  };

  const openDialog = () => {
    setIsDeletionBlocked(false);
    setServerError(undefined);
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    const remainingTransactions = transactions.filter(
      (transaction) => transaction.id !== transactionId
    );
    if (!hasNonNegativeBalancePrefixes(remainingTransactions)) {
      setIsDeletionBlocked(true);
      return;
    }

    setDeleting(true);
    try {
      await commands.deleteTransaction(transactionId);
      closeDialog();
    } catch (caught) {
      setServerError(
        caught instanceof Error ? caught.message : t('delete.transactionError')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        aria-label={ariaLabel}
        className={styles.iconButton}
        onClick={openDialog}
        type="button"
      >
        <Trash size={18} />
      </button>
      <Dialog
        isOpen={isDialogOpen}
        title={t('delete.transactionTitle')}
        onClose={closeDialog}
      >
        <p>{t('delete.transactionDescription')}</p>
        {isDeletionBlocked && (
          <p className={styles.error} role="alert">
            {t('delete.transactionBlocked')}
          </p>
        )}
        {serverError && (
          <p className={styles.error} role="alert">
            {serverError}
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={closeDialog} variant="secondary">
            {t('delete.cancel')}
          </Button>
          <Button
            disabled={deleting || commands.busy}
            onClick={() => void handleConfirm()}
            variant="danger"
          >
            {deleting ? t('delete.deleting') : t('delete.action')}
          </Button>
        </div>
      </Dialog>
    </>
  );
};
