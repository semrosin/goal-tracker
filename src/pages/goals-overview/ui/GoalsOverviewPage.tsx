import { useState } from 'react';

import { useAppSelector } from '../../../app/store/hooks';
import { CreateGoalDialog } from '../../../features/create-goal/ui/CreateGoalDialog';
import { Button } from '../../../shared/ui/Button/Button';
import { GoalsList } from '../../../widgets/goals-list/ui/GoalsList';
import styles from './GoalsOverviewPage.module.scss';

export const GoalsOverviewPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const hasGoals = useAppSelector((state) => state.goals.length > 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Мои цели</h1>
        <Button className={styles.createButton} onClick={() => setIsCreateDialogOpen(true)}>
          Создать цель
        </Button>
      </header>
      <section aria-label="Список целей" className={styles.content}>
        {hasGoals ? <GoalsList /> : <p className={styles.emptyState}>Пока нет целей</p>}
      </section>
      <CreateGoalDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
    </main>
  );
};
