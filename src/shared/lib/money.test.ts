import { formatRubles } from './money';

describe('formatRubles', () => {
  it('formats an integer as a Russian-ruble amount', () => {
    expect(formatRubles(123456)).toContain('₽');
    expect(formatRubles(123456)).toMatch(/123(?:\u00a0|\s)456/);
  });
});
