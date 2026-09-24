import { fireEvent, render, screen } from '@testing-library/react';

import App from './App';
import { DEMO_STORAGE_KEY } from './store/persistence';

describe('App', () => {
  it('renders the welcome route through the application root', () => {
    localStorage.clear();
    localStorage.setItem('goal-tracker-locale', 'ru');
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Копите на важное с понятным планом',
      })
    ).toBeInTheDocument();
  });

  it('opens an isolated seeded demo after choosing it', async () => {
    localStorage.clear();
    localStorage.setItem('goal-tracker-locale', 'ru');
    window.history.replaceState({}, '', '/');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Посмотреть демо' }));

    expect(
      await screen.findByRole('heading', { name: 'Мои цели' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Финансовая подушка/ })
    ).toBeInTheDocument();
    expect(localStorage.getItem('goal-tracker-mode')).toBe('demo');
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).not.toBeNull();
  });
});
