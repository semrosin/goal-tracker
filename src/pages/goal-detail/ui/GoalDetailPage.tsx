import { Link, useParams } from 'react-router';

import { useAppSelector } from '../../../app/store/hooks';
import { selectGoalById } from '../../../entities/goal/model/selectors';
import styles from './GoalDetailPage.module.scss';

export const GoalDetailPage = () => {
  const { id } = useParams();
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
    </main>
  );
};
