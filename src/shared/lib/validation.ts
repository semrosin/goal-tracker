export const isPositiveInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;
