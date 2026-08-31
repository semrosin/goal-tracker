import { Navigate, Route, Routes } from 'react-router';

import { GoalDetailPage } from '../../pages/goal-detail';
import { GoalsOverviewPage } from '../../pages/goals-overview';

export const AppRouter = () => (
  <Routes>
    <Route element={<GoalsOverviewPage />} path="/" />
    <Route element={<GoalDetailPage />} path="/goals/:id" />
    <Route element={<Navigate replace to="/" />} path="*" />
  </Routes>
);
