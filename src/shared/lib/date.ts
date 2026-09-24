import type { Locale } from './i18n';

export const createTimestamp = (): string => new Date().toISOString();

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  ru: new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
};

export const formatDate = (iso: string, locale: Locale = 'ru'): string =>
  dateFormatters[locale].format(new Date(iso));
