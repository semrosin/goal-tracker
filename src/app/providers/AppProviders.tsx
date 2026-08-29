import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { store } from '../store/store';

export const AppProviders = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
