import { configureStore } from '@reduxjs/toolkit';

import {
  decodeLedgerState,
  ledgerInitialState,
  type LedgerState,
} from '../../entities/ledger';
import { getDemoSeed } from './demoSeed';
import type { Locale } from '../../shared/lib/i18n';
import {
  DEMO_STORAGE_KEY,
  loadPersistedState,
  savePersistedState,
} from './persistence';
import { rootReducer } from './rootReducer';

type StoreOptions = { persist?: boolean; storageKey?: string };

export const createAppStore = (
  preloadedState?: LedgerState,
  { persist = true, storageKey }: StoreOptions = {}
) => {
  const canonicalPreloadedState = preloadedState
    ? (decodeLedgerState(preloadedState) ?? ledgerInitialState)
    : persist
      ? loadPersistedState(storageKey)
      : ledgerInitialState;

  const appStore = configureStore({
    reducer: rootReducer,
    preloadedState: canonicalPreloadedState,
  });

  if (persist) {
    appStore.subscribe(() => {
      savePersistedState(appStore.getState(), storageKey);
    });
  }

  return appStore;
};

export const createDemoStore = (locale: Locale = 'ru') => {
  const initialState =
    loadPersistedState(DEMO_STORAGE_KEY) ??
    loadPersistedState() ??
    getDemoSeed(locale);
  const demoStore = createAppStore(initialState, {
    storageKey: DEMO_STORAGE_KEY,
  });
  savePersistedState(demoStore.getState(), DEMO_STORAGE_KEY);
  return demoStore;
};

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
