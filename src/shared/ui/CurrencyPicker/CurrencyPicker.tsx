import { useI18n } from '../../lib/i18n';
import type { Currency } from '../../lib/money';
import { SelectField } from '../SelectField/SelectField';

export const CurrencyPicker = ({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
}) => {
  const { t } = useI18n();
  return (
    <SelectField
      label={t('goal.currencyLabel')}
      value={value}
      onChange={(event) => onChange(event.target.value as Currency)}
    >
      <option value="RUB">{t('currency.rub')}</option>
      <option value="USD">{t('currency.usd')}</option>
    </SelectField>
  );
};
