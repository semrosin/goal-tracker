import { BrowserRouter } from 'react-router';

import { routerBasename } from '../shared/lib/publicPath';
import { LocaleProvider } from '../shared/lib/i18n';
import { AppRouter } from './router/AppRouter';
import { ApplicationProvider } from './session/ApplicationProvider';

const App = () => (
  <LocaleProvider>
    <BrowserRouter basename={routerBasename()}>
      <ApplicationProvider>
        <AppRouter />
      </ApplicationProvider>
    </BrowserRouter>
  </LocaleProvider>
);

export default App;
