import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store/store';

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
