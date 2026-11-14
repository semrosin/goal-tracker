import { useI18n } from '../../lib/i18n';
import type { Currency } from '../../lib/money';
import styles from './CurrencyPicker.module.scss';

export const CurrencyPicker = ({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
}) => {
  const { t } = useI18n();
  return (
    <select
      aria-label={t('goal.currencyLabel')}
      className={styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value as Currency)}
    >
      <option value="RUB">₽</option>
      <option value="USD">$</option>
    </select>
  );
};
