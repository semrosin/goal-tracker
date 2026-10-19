import { formatMoney, formatRubles } from './money';

test('formats dollars independently from the interface language', () => {
  expect(formatMoney(123456, 'USD', 'en')).toBe('$123,456');
  expect(formatMoney(123456, 'USD', 'ru')).toContain('$');
  expect(formatMoney(123456, undefined, 'en')).toBe('123,456 ₽');
});

describe('formatRubles', () => {
  it('formats an integer as a Russian-ruble amount', () => {
    expect(formatRubles(123456)).toContain('₽');
    expect(formatRubles(123456)).toMatch(/123(?:\u00a0|\s)456/);
  });

  it('uses English grouping while keeping rubles for English readers', () => {
    expect(formatRubles(123456, 'en')).toMatch(/123,456/);
    expect(formatRubles(123456, 'en')).toContain('₽');
  });
});
