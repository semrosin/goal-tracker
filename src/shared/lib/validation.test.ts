import { isPositiveInteger } from './validation';

test('accepts the maximum safe positive whole-ruble value', () => {
  expect(isPositiveInteger(1)).toBe(true);
  expect(isPositiveInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
});

test('rejects an integer above the safe whole-ruble range', () => {
  expect(isPositiveInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
});

test('rejects a rounded oversized numeric whole-ruble value', () => {
  const roundedOversizedValue = 9_007_199_254_740_993;

  expect(isPositiveInteger(roundedOversizedValue)).toBe(false);
});
