import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { createAppStore } from '../store/store';
import { AppRouter } from './AppRouter';

describe('AppRouter', () => {
  it('shows a safe state for an unknown goal id', () => {
    render(
      <Provider store={createAppStore({ goals: [], transactions: [] })}>
        <MemoryRouter initialEntries={['/goals/missing']}>
          <AppRouter />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Цель не найдена' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'К списку целей' })).toHaveAttribute('href', '/');
  });
});
