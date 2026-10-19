import type { Locale } from './i18n';

export type Currency = 'RUB' | 'USD';

const dollarFormatters: Record<Locale, Intl.NumberFormat> = {
  ru: new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
  en: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
};

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

export const formatMoney = (
  amount: number,
  currency: Currency = 'RUB',
  locale: Locale = 'ru'
): string =>
  currency === 'USD'
    ? dollarFormatters[locale].format(amount)
    : formatRubles(amount, locale);
