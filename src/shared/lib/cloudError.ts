import type { MessageKey } from './i18n';

export const cloudErrorKey = (error: unknown): MessageKey => {
  const message = error instanceof Error ? error.message : '';
  if (/Insufficient balance/i.test(message)) return 'error.balance';
  if (/history negative/i.test(message)) return 'error.history';
  if (/serialize access|\b40001\b/i.test(message)) return 'error.concurrent';
  if (/Goal not found/i.test(message)) return 'error.goalMissing';
  if (/Transaction not found/i.test(message)) return 'error.transactionMissing';
  if (/Некорректные данные|invalid data/i.test(message)) return 'error.badData';
  return 'error.request';
};
