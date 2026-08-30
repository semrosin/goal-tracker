import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { useLedgerSelector } from '../../../entities/ledger';
import { selectGoalById } from '../../../entities/goal/model/selectors';
import { TransactionForm } from '../../../features/add-transaction/ui/TransactionForm';
import { DeleteGoalButton } from '../../../features/delete-goal/ui/DeleteGoalButton';
import { EditGoalDialog } from '../../../features/edit-goal/ui/EditGoalDialog';
import { Button } from '../../../shared/ui/Button/Button';
import { GoalSummary } from '../../../widgets/goal-details/ui/GoalSummary';
import { TransactionsHistory } from '../../../widgets/goal-details/ui/TransactionsHistory';
import styles from './GoalDetailPage.module.scss';

export const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const goal = useLedgerSelector((state) =>
    selectGoalById(state.goals, id ?? '')
  );

  if (goal === undefined) {
    return (
      <main className={styles.page}>
        <h1>Цель не найдена</h1>
        <Link to="/">К списку целей</Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">
        К списку целей
      </Link>
      <h1>{goal.title}</h1>
      <div className={styles.layout}>
        <GoalSummary goal={goal} />
        <TransactionForm goalId={goal.id} />
        <TransactionsHistory goalId={goal.id} />
        <div className={styles.actions}>
          <Button onClick={() => setIsEditDialogOpen(true)} variant="secondary">
            Изменить цель
          </Button>
          <DeleteGoalButton goalId={goal.id} onDeleted={() => navigate('/')} />
        </div>
      </div>
      <EditGoalDialog
        goal={goal}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </main>
  );
};
