import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { store } from './app/store/store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import './app/styles/global.scss';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
