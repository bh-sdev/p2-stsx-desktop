import { createContext, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';

import ROUTER_PATH from 'const/router.path';
import useActions from 'hooks/useActions';
import { EVENT_TYPE_NAMES, LOCAL_STORAGE_VARIABLES } from 'const';
import ServiceUserStorage from 'services/ServiceUserStorage';
import { ServiceEventBus, ServiceTokenStorage } from 'services';
import MainTabs from './components/MainTabs';
import { logout } from 'api';

export const GlobalContext = createContext({});

const Application = () => {
  const refToast = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { removeHistoryLink, referenceAssociations, applicationPermission } = useActions();
  const history = useSelector((state) => state.history);

  useEffect(() => {
    ServiceEventBus.$on(EVENT_TYPE_NAMES.LOGOUT, onClickLogout);
  }, [history]);

  const clearHistory = () => {
    const HISTORY_LINKS = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY),
    );
    HISTORY_LINKS?.forEach(({ ID }) => {
      removeHistoryLink(ID);
      const win = window.open('', ID);
      win.close();
    });
  };

  const onClickLogout = () => {
    if (ServiceTokenStorage.hasToken()) {
      logout();
    }
    ServiceTokenStorage.clearSessionToken();
    sessionStorage.removeItem(LOCAL_STORAGE_VARIABLES.SESSION_STORAGE_HISTORY);
    clearHistory();
    setTimeout(() => {
      ServiceTokenStorage.clear();
      ServiceUserStorage.clear();
      document.title = 'STS Desktop';
      navigate('/auth');
    }, 100);
  };

  useEffect(() => {
    referenceAssociations();
    applicationPermission();
  }, []);

  return (
    <div id="main" className="h-full flex flex-column">
      <Toast ref={refToast} />
      <ConfirmDialog />
      {!location.pathname.includes(ROUTER_PATH.home) ? null : <MainTabs />}
      <GlobalContext.Provider value={{ refToast }}>
        <Outlet />
      </GlobalContext.Provider>
    </div>
  );
};

export default Application;
