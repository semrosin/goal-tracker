export { goalsActions, goalsReducer } from './model/goalSlice';
export { calculateProgress, selectGoalById } from './model/selectors';
export {
  calculateGoalPlan,
  forecastCompletionMonth,
  getCurrentMonth,
  isValidTargetMonth,
  type GoalPlan,
} from './model/planning';
export type { Goal, GoalUpdate } from './model/types';
