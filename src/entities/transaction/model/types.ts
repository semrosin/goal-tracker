export type TransactionType = 'deposit' | 'withdrawal';

export type Transaction = {
  id: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
};
