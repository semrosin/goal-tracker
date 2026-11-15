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

export {
  goalColors,
  goalIcons,
  isGoalColor,
  isGoalIcon,
  type GoalColor,
  type GoalIconName,
} from './model/appearance';
export { GoalAppearancePicker, GoalIcon } from './ui/GoalAppearance';

export {
  filterGoals,
  normalizeGoalFilters,
  type GoalFilters,
} from './model/filterGoals';
