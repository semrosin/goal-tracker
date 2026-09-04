import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders the overview route through the application root', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Мои цели' })
    ).toBeInTheDocument();
  });
});
