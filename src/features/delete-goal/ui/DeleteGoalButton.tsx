import { useState } from 'react';

import { useLedgerCommands } from '../../../entities/ledger';
import { useI18n } from '../../../shared/lib/i18n';
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
  const { t } = useI18n();
  const commands = useLedgerCommands();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const closeDialog = () => {
    setIsDialogOpen(false);
    setError(undefined);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      await commands.deleteGoal(goalId);
      closeDialog();
      onDeleted?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t('delete.goalError')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} variant="danger">
        {t('delete.action')}
      </Button>
      <Dialog
        isOpen={isDialogOpen}
        title={t('delete.action')}
        onClose={closeDialog}
      >
        <p>{t('delete.goalDescription')}</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
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
