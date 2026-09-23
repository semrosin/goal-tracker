import { BrowserRouter } from 'react-router';

import { LocaleProvider } from '../shared/lib/i18n';
import { AppRouter } from './router/AppRouter';
import { ApplicationProvider } from './session/ApplicationProvider';

const App = () => (
  <LocaleProvider>
    <BrowserRouter>
      <ApplicationProvider>
        <AppRouter />
      </ApplicationProvider>
    </BrowserRouter>
  </LocaleProvider>
);

export default App;
