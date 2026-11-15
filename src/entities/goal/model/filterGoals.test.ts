import { filterGoals } from './filterGoals';

const goals = [
  {
    id: 'a',
    title: 'Alpha',
    description: 'Beach',
    targetAmount: 100,
    targetMonth: '2027-01',
    currency: 'USD' as const,
    createdAt: '',
  },
  { id: 'b', title: 'Beta', targetAmount: 100, createdAt: '' },
  {
    id: 'c',
    title: 'Gamma',
    targetAmount: 100,
    targetMonth: '2026-01',
    createdAt: '',
  },
];
const balances = new Map([
  ['a', 50],
  ['b', 100],
  ['c', 50],
]);

test('combines description search, currency and active status', () => {
  expect(
    filterGoals(
      goals,
      balances,
      {
        search: 'BEACH',
        status: 'active',
        currency: 'USD',
        deadline: 'all',
        sort: 'original',
      },
      'en'
    ).map((g) => g.id)
  ).toEqual(['a']);
});

test('sorts deadlines with missing dates last and preserves ties', () => {
  expect(
    filterGoals(
      goals,
      balances,
      {
        search: '',
        status: 'all',
        currency: 'all',
        deadline: 'all',
        sort: 'deadline',
      },
      'en'
    ).map((g) => g.id)
  ).toEqual(['c', 'a', 'b']);
  expect(
    filterGoals(
      goals,
      balances,
      {
        search: '',
        status: 'all',
        currency: 'all',
        deadline: 'all',
        sort: 'progress',
      },
      'en'
    ).map((g) => g.id)
  ).toEqual(['b', 'a', 'c']);
});

test('ignores unsupported filter values in a direct link', () => {
  expect(
    filterGoals(
      goals,
      balances,
      {
        search: '',
        status: 'unknown',
        currency: 'unknown',
        deadline: 'unknown',
        sort: 'unknown',
      },
      'en'
    ).map((g) => g.id)
  ).toEqual(['a', 'b', 'c']);
});

test('filters completed goals, rubles and goals without deadlines', () => {
  expect(
    filterGoals(
      goals,
      balances,
      {
        search: '',
        status: 'completed',
        currency: 'RUB',
        deadline: 'none',
        sort: 'name',
      },
      'ru'
    ).map((g) => g.id)
  ).toEqual(['b']);
});

test('sorts by name using the chosen locale', () => {
  expect(
    filterGoals(
      [...goals].reverse(),
      balances,
      {
        search: '',
        status: 'all',
        currency: 'all',
        deadline: 'all',
        sort: 'name',
      },
      'en'
    ).map((g) => g.id)
  ).toEqual(['a', 'b', 'c']);
});
