import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { rootInitialState, type RootState } from '../store/rootReducer';
import { createAppStore } from '../store/store';

export const renderWithStore = (
  ui: ReactElement,
  preloadedState: RootState = rootInitialState
) => {
  const store = createAppStore(preloadedState);

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
  };
};
