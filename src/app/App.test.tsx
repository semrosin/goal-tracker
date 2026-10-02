import { render, screen } from '@testing-library/react';

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

  it('restores the isolated offline demo from a stored preference', async () => {
    localStorage.clear();
    localStorage.setItem('goal-tracker-locale', 'ru');
    localStorage.setItem('goal-tracker-mode', 'demo');
    window.history.replaceState({}, '', '/app');
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Мои цели' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Финансовая подушка/ })
    ).toBeInTheDocument();
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).not.toBeNull();
  });
});
