import { cloudErrorKey } from './cloudError';

test('maps server invariants to stable user-facing error keys', () => {
  expect(cloudErrorKey(new Error('Insufficient balance'))).toBe(
    'error.balance'
  );
  expect(
    cloudErrorKey(new Error('Deleting transaction would make history negative'))
  ).toBe('error.history');
  expect(
    cloudErrorKey(
      new Error('could not serialize access due to concurrent update')
    )
  ).toBe('error.concurrent');
});

test('uses a generic message for unexpected server text', () => {
  expect(cloudErrorKey(new Error('internal detail'))).toBe('error.request');
});
