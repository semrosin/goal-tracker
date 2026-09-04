export type Goal = {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  createdAt: string;
};

export type GoalUpdate = Pick<
  Goal,
  'id' | 'title' | 'targetAmount' | 'description'
>;
