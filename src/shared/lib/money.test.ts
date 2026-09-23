import { formatRubles } from './money';

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
