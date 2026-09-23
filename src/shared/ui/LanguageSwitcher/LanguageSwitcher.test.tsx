import { fireEvent, render, screen } from '@testing-library/react';

import { LocaleProvider } from '../../lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('changes the active language and reports it to assistive technology', () => {
    localStorage.setItem('goal-tracker-locale', 'ru');
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    );

    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.documentElement.lang).toBe('en');
  });
});
