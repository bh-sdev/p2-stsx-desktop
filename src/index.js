import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';

import 'styles/index.scss';
//theme
import 'theme/themes/mytheme/theme.scss';
//core
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';
import 'primeflex/primeflex.css';

import { MAIN_ROUTES } from 'router';
import ServiceLocalization from 'services/ServiceLocalization';
import store from './store';

const LocalizationProvider = new ServiceLocalization().provider;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={LocalizationProvider}>
      <PrimeReactProvider value={{ cssTransition: false, nullSortOrder: -1 }}>
        <Provider store={store}>
          <RouterProvider router={createBrowserRouter(MAIN_ROUTES)} />
        </Provider>
      </PrimeReactProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
