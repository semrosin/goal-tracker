import type { Locale } from './i18n';

const rubleFormatters: Record<Locale, Intl.NumberFormat> = {
  ru: new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }),
  en: new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }),
};

export const formatRubles = (amount: number, locale: Locale = 'ru'): string =>
  `${rubleFormatters[locale].format(amount)}${locale === 'en' ? ' ₽' : ''}`;
