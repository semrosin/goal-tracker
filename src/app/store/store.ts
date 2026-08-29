import { configureStore } from '@reduxjs/toolkit';

import { loadPersistedState, savePersistedState } from './persistence';
import { rootReducer, type RootState as RootReducerState } from './rootReducer';

export const createAppStore = (preloadedState?: RootReducerState) => {
  const appStore = configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState ?? loadPersistedState(),
  });

  appStore.subscribe(() => {
    savePersistedState(appStore.getState());
  });

  return appStore;
};

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
