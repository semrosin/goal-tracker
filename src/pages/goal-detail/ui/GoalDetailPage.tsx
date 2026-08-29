import { Link, useNavigate, useParams } from 'react-router';

import { useAppSelector } from '../../../app/store/hooks';
import { selectGoalById } from '../../../entities/goal/model/selectors';
import { DeleteGoalButton } from '../../../features/delete-goal/ui/DeleteGoalButton';
import { EditGoalDialog } from '../../../features/edit-goal/ui/EditGoalDialog';
import { Button } from '../../../shared/ui/Button/Button';
import styles from './GoalDetailPage.module.scss';
import { useState } from 'react';

export const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const goal = useAppSelector((state) => selectGoalById(state.goals, id ?? ''));

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
      <h1>{goal.title}</h1>
      <div className={styles.actions}>
        <Button onClick={() => setIsEditDialogOpen(true)} variant="secondary">
          Изменить цель
        </Button>
        <DeleteGoalButton goalId={goal.id} onDeleted={() => navigate('/')} />
      </div>
      <EditGoalDialog goal={goal} isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
    </main>
  );
};
