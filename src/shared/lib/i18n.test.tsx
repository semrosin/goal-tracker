import { fireEvent, render, screen } from '@testing-library/react';

import { LocaleProvider, resolveLocale, useI18n } from './i18n';

const Probe = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <span>{locale}</span>
      <p>{t('welcome.title')}</p>
      <button onClick={() => setLocale('en')}>English</button>
    </div>
  );
};

describe('i18n', () => {
  it('uses the saved language before the browser language', () => {
    expect(resolveLocale('en', 'ru-RU')).toBe('en');
    expect(resolveLocale(null, 'ru-RU')).toBe('ru');
    expect(resolveLocale(null, 'fr-FR')).toBe('en');
  });

  it('switches visible copy and persists the choice', () => {
    localStorage.setItem('goal-tracker-locale', 'ru');
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );

    expect(
      screen.getByText('Копите на важное с понятным планом')
    ).toBeInTheDocument();
    expect(document.title).toBe('Goal Tracker — цели накоплений');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(
      screen.getByText('Save for what matters with a clear plan')
    ).toBeInTheDocument();
    expect(document.title).toBe('Goal Tracker — savings goals');
    expect(localStorage.getItem('goal-tracker-locale')).toBe('en');
  });
});
