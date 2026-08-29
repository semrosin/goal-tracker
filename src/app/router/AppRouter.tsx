import { Navigate, Route, Routes } from 'react-router';

import { GoalDetailPage } from '../../pages/goal-detail/ui/GoalDetailPage';
import { GoalsOverviewPage } from '../../pages/goals-overview/ui/GoalsOverviewPage';

export const AppRouter = () => (
  <Routes>
    <Route element={<GoalsOverviewPage />} path="/" />
    <Route element={<GoalDetailPage />} path="/goals/:id" />
    <Route element={<Navigate replace to="/" />} path="*" />
  </Routes>
);
