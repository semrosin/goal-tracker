import { formatDate } from './date';

test('formats transaction dates in the chosen language', () => {
  const timestamp = '2026-09-23T12:00:00.000Z';
  expect(formatDate(timestamp, 'ru')).not.toBe(formatDate(timestamp, 'en'));
  expect(formatDate(timestamp, 'en')).toMatch(/Sep/);
});
