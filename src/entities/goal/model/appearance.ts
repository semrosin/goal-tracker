export const goalColors = [
  'violet',
  'forest',
  'ocean',
  'amber',
  'rose',
] as const;
export const goalIcons = [
  'target',
  'plane',
  'home',
  'car',
  'gift',
  'heart',
  'laptop',
  'graduation',
] as const;
export type GoalColor = (typeof goalColors)[number];
export type GoalIconName = (typeof goalIcons)[number];
export const isGoalColor = (value: unknown): value is GoalColor =>
  typeof value === 'string' &&
  (goalColors as readonly string[]).includes(value);
export const isGoalIcon = (value: unknown): value is GoalIconName =>
  typeof value === 'string' && (goalIcons as readonly string[]).includes(value);
