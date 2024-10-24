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
import { updateBaseURL } from 'configs';

const LocalizationProvider = new ServiceLocalization().provider;

const root = ReactDOM.createRoot(document.getElementById('root'));

const boot = async () => {
  try {
    const res = await fetch('/env.json').then((e) => e.json());
    // console.log('RES: ', { res, API_CONFIG: { ...API_CONFIG } });
    if (res?.BASE_API_URL !== undefined) {
      updateBaseURL(res.BASE_API_URL);
    }
    // console.log('RES AFTERMAT: ', { res, API_CONFIG: { ...API_CONFIG } });
  } finally {
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
  }
};

boot();
