import { fireEvent, render, screen } from '@testing-library/react';

import { LocaleProvider } from '../../../shared/lib/i18n';
import { WelcomePage } from './WelcomePage';

describe('WelcomePage', () => {
  it('lets a first-time visitor choose demo without signing in', () => {
    const onOpenDemo = jest.fn();
    const onSignIn = jest.fn();

    render(<WelcomePage onOpenDemo={onOpenDemo} onSignIn={onSignIn} />);

    expect(
      screen.getByRole('heading', { name: /копите на важное/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /посмотреть демо/i }));

    expect(onOpenDemo).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('offers a separate sign-in action', () => {
    const onSignIn = jest.fn();

    render(<WelcomePage onOpenDemo={() => undefined} onSignIn={onSignIn} />);
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows English copy after switching language', () => {
    localStorage.setItem('goal-tracker-locale', 'ru');
    render(
      <LocaleProvider>
        <WelcomePage onOpenDemo={() => undefined} onSignIn={() => undefined} />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('heading', {
        name: 'Save for what matters with a clear plan',
      })
    ).toBeInTheDocument();
  });
});
