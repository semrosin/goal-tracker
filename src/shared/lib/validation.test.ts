import { isPositiveInteger } from './validation';

test('accepts the maximum safe positive whole-ruble value', () => {
  expect(isPositiveInteger(1)).toBe(true);
  expect(isPositiveInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
});

test('rejects an integer above the safe whole-ruble range', () => {
  expect(isPositiveInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
});

test('rejects a safely representable whole-ruble value above the maximum', () => {
  const roundedOversizedValue = Number.MAX_SAFE_INTEGER + 2;

  expect(isPositiveInteger(roundedOversizedValue)).toBe(false);
});
