import { configureStore } from '@reduxjs/toolkit';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import {
  decodeLedgerState,
  ledgerInitialState,
  ledgerReducer,
  type LedgerState,
} from '../model/ledger';

export const renderWithLedger = (
  ui: ReactElement,
  preloadedState: LedgerState = ledgerInitialState
) => {
  const store = configureStore({
    reducer: ledgerReducer,
    preloadedState: decodeLedgerState(preloadedState) ?? ledgerInitialState,
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
  };
};
