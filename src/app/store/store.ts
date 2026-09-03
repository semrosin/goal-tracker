import { configureStore } from '@reduxjs/toolkit';

import {
  decodeLedgerState,
  ledgerInitialState,
  type LedgerState,
} from '../../entities/ledger';
import { loadPersistedState, savePersistedState } from './persistence';
import { rootReducer } from './rootReducer';

export const createAppStore = (preloadedState?: LedgerState) => {
  const canonicalPreloadedState = preloadedState
    ? (decodeLedgerState(preloadedState) ?? ledgerInitialState)
    : loadPersistedState();

  const appStore = configureStore({
    reducer: rootReducer,
    preloadedState: canonicalPreloadedState,
  });

  appStore.subscribe(() => {
    savePersistedState(appStore.getState());
  });

  return appStore;
};

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
