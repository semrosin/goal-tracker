export const createTimestamp = (): string => new Date().toISOString();

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
