import { useState } from 'react';

import { useI18n } from '../../lib/i18n';
import { Field } from '../Field/Field';
import { SelectField } from '../SelectField/SelectField';
import styles from './MonthPicker.module.scss';

export const MonthPicker = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => {
  const { locale, t } = useI18n();
  const [emptyYear, setEmptyYear] = useState(String(new Date().getFullYear()));
  const [year, month = ''] = value ? value.split('-') : [emptyYear, ''];
  const formatter = new Intl.DateTimeFormat(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { month: 'long' }
  );

  return (
    <div className={styles.picker}>
      <SelectField
        error={error}
        label={t('goal.monthLabel')}
        value={month}
        onChange={(event) =>
          onChange(event.target.value ? `${year}-${event.target.value}` : '')
        }
      >
        <option value="">{t('goal.noDeadline')}</option>
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index} value={String(index + 1).padStart(2, '0')}>
            {formatter.format(new Date(2026, index, 1))}
          </option>
        ))}
      </SelectField>
      <Field
        label={t('goal.yearLabel')}
        min={1}
        max={9999}
        type="number"
        inputMode="numeric"
        value={year}
        onChange={(event) => {
          const nextYear = event.target.value;
          setEmptyYear(nextYear);
          if (month) onChange(`${nextYear}-${month}`);
        }}
      />
    </div>
  );
};
