import type { LedgerState } from '../../entities/ledger';
import { getCurrentMonth } from '../../entities/goal';
import type { Locale } from '../../shared/lib/i18n';

// Fixed dates keep the demo stable across visits. The values are fictional.
export const demoSeed: LedgerState = {
  goals: [
    {
      id: 'demo-emergency-fund',
      title: 'Финансовая подушка',
      description: 'Запас на непредвиденные расходы',
      targetAmount: 300000,
      createdAt: '2026-01-02T09:00:00.000Z',
    },
    {
      id: 'demo-vacation',
      title: 'Путешествие',
      description: 'Поездка к морю',
      targetAmount: 180000,
      createdAt: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 'demo-laptop',
      title: 'Новый ноутбук',
      description: 'Техника для работы и учёбы',
      targetAmount: 120000,
      createdAt: '2026-03-01T09:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: 'demo-t1',
      goalId: 'demo-emergency-fund',
      type: 'deposit',
      amount: 70000,
      createdAt: '2026-01-02T10:00:00.000Z',
    },
    {
      id: 'demo-t2',
      goalId: 'demo-vacation',
      type: 'deposit',
      amount: 25000,
      createdAt: '2026-02-02T10:00:00.000Z',
    },
    {
      id: 'demo-t3',
      goalId: 'demo-emergency-fund',
      type: 'deposit',
      amount: 30000,
      createdAt: '2026-03-02T10:00:00.000Z',
    },
    {
      id: 'demo-t4',
      goalId: 'demo-laptop',
      type: 'deposit',
      amount: 120000,
      createdAt: '2026-04-02T10:00:00.000Z',
    },
    {
      id: 'demo-t5',
      goalId: 'demo-vacation',
      type: 'deposit',
      amount: 40000,
      createdAt: '2026-05-02T10:00:00.000Z',
    },
    {
      id: 'demo-t6',
      goalId: 'demo-vacation',
      type: 'withdrawal',
      amount: 5000,
      createdAt: '2026-05-03T10:00:00.000Z',
    },
  ],
};

const englishGoals: Record<string, { title: string; description: string }> = {
  'demo-emergency-fund': {
    title: 'Emergency fund',
    description: 'A cushion for unexpected expenses',
  },
  'demo-vacation': {
    title: 'Seaside trip',
    description: 'A break by the sea',
  },
  'demo-laptop': {
    title: 'New laptop',
    description: 'A device for work and study',
  },
};

const monthAfter = (month: string, offset: number): string => {
  const index =
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};

export const getDemoSeed = (locale: Locale): LedgerState => {
  const currentMonth = getCurrentMonth();
  return {
    goals: demoSeed.goals.map((goal) => ({
      ...goal,
      ...(locale === 'en' ? englishGoals[goal.id] : {}),
      ...(goal.id === 'demo-laptop'
        ? {}
        : {
            targetMonth: monthAfter(
              currentMonth,
              goal.id === 'demo-vacation' ? 8 : 14
            ),
          }),
    })),
    transactions: demoSeed.transactions,
  };
};
