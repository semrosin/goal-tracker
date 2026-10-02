import { fireEvent, render, screen } from '@testing-library/react';

import { LocaleProvider } from '../../../shared/lib/i18n';
import { WelcomePage } from './WelcomePage';

describe('WelcomePage', () => {
  it('offers sign-up as the primary action without a demo', () => {
    const onSignUp = jest.fn();
    const onSignIn = jest.fn();

    render(<WelcomePage onSignIn={onSignIn} onSignUp={onSignUp} />);

    expect(
      screen.getByRole('heading', { name: /копите на важное/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /демо/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }));

    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('offers a separate sign-in action', () => {
    const onSignIn = jest.fn();

    render(<WelcomePage onSignIn={onSignIn} onSignUp={() => undefined} />);
    fireEvent.click(screen.getAllByRole('button', { name: /войти/i })[0]);

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('explains what the service can do', () => {
    render(
      <WelcomePage onSignIn={() => undefined} onSignUp={() => undefined} />
    );

    expect(
      screen.getByRole('heading', { name: 'Всё для ваших накоплений' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Цели с прогрессом' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Как начать' })
    ).toBeInTheDocument();
  });

  it('shows English copy after switching language', () => {
    localStorage.setItem('goal-tracker-locale', 'ru');
    render(
      <LocaleProvider>
        <WelcomePage onSignIn={() => undefined} onSignUp={() => undefined} />
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
