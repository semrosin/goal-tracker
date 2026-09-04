import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { selectGoalById } from '../../../entities/goal';
import { useLedgerSelector } from '../../../entities/ledger';
import { calculateBalance } from '../../../entities/transaction';
import { TransactionForm } from '../../../features/add-transaction';
import { DeleteGoalButton } from '../../../features/delete-goal';
import { EditGoalDialog } from '../../../features/edit-goal';
import { Button } from '../../../shared/ui/Button/Button';
import {
  GoalSummary,
  TransactionsHistory,
} from '../../../widgets/goal-details';
import styles from './GoalDetailPage.module.scss';

export const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const goal = useLedgerSelector((state) =>
    selectGoalById(state.goals, id ?? '')
  );
  const balance = useLedgerSelector((state) =>
    calculateBalance(id ?? '', state.transactions)
  );

  if (goal === undefined) {
    return (
      <main className={styles.page}>
        <h1>Цель не найдена</h1>
        <Link to="/">
          <ChevronLeft size={16} />К списку целей
        </Link>
      </main>
    );
  }

  const isCompleted = balance >= goal.targetAmount;

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">
        <ChevronLeft size={16} />К списку целей
      </Link>
      <h1>{goal.title}</h1>
      <div className={styles.layout}>
        <GoalSummary goal={goal} isCompleted={isCompleted} />
        <TransactionForm goalId={goal.id} isCompleted={isCompleted} />
        <TransactionsHistory goalId={goal.id} isCompleted={isCompleted} />
        <div className={styles.actions}>
          <Button onClick={() => setIsEditDialogOpen(true)} variant="secondary">
            Изменить
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
