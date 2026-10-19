import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { LocaleProvider } from '../../lib/i18n';
import { MonthPicker } from './MonthPicker';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

test('uses the app language for months and can clear an existing deadline', () => {
  localStorage.setItem('goal-tracker-locale', 'en');
  const Host = () => {
    const [value, setValue] = useState('2027-02');
    return (
      <>
        <LanguageSwitcher />
        <MonthPicker value={value} onChange={setValue} />
      </>
    );
  };
  render(
    <LocaleProvider>
      <Host />
    </LocaleProvider>
  );
  expect(screen.getByRole('option', { name: 'February' })).toBeInTheDocument();
  expect(screen.getByLabelText('Year')).toHaveValue(2027);
  fireEvent.change(screen.getByLabelText('Target month'), {
    target: { value: '' },
  });
  expect(screen.getByLabelText('Target month')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'RU' }));
  expect(screen.getByRole('option', { name: 'февраль' })).toBeInTheDocument();
  localStorage.removeItem('goal-tracker-locale');
});
