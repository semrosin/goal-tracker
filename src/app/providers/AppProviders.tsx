import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { store } from '../store/store';

//TODO: move to App.tsx?
export const AppProviders = ({ children }: PropsWithChildren) => (
  <Provider store={store}>
    <BrowserRouter>{children}</BrowserRouter>
  </Provider>
);
