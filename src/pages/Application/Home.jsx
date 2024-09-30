import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { TabMenu } from 'primereact/tabmenu';
import { ScrollPanel } from 'primereact/scrollpanel';

import { ServiceTokenStorage } from 'services';
import useTabsNavigation from 'hooks/useTabsNavigation';
import ServiceUserStorage from 'services/ServiceUserStorage';
import useActions from 'hooks/useActions';
import { logout } from 'api';
import { LOCAL_STORAGE_VARIABLES } from 'const';
import { debounce, getDocumentTitleInfo } from 'utils';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { removeHistoryLink } = useActions();

  const paths = [
    '/home/import-export',
    '/home/edit-add',
    '/home/view-info',
    '/home/reports-labels',
    '/home/settings',
  ];

  const [activeTab, setActiveTab] = useState(
    paths.indexOf(location.pathname) >= 0 ? paths.indexOf(location.pathname) : 2,
  );
  const [initialTableHeight, setInitialTableHeight] = useState(0);

  const HOME_TABS = [
    {
      label: t('sts.tab.import.export'),
    },
    {
      label: t('sts.tab.edit.add'),
    },
    {
      label: t('sts.tab.view.info'),
    },
    {
      label: t('sts.tab.reports.labels'),
    },
    {
      label: t('STS'),
    },
  ];

  useEffect(() => {
    navigate(paths[activeTab]);
  }, [activeTab]);

  useTabsNavigation({
    set: setActiveTab,
    length: HOME_TABS.length,
  });

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
    ServiceTokenStorage.clear();
    ServiceUserStorage.clear();
    document.title = 'STS Desktop';
    navigate('/auth');
  };

  const clearSession = () => {
    if (ServiceTokenStorage.hasToken()) {
      logout();
    }
    ServiceTokenStorage.clearSessionToken();
    sessionStorage.removeItem(LOCAL_STORAGE_VARIABLES.SESSION_STORAGE_HISTORY);
    clearHistory();
    setTimeout(() => {
      onClickLogout();
    }, 100);
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  return (
    <div id="home" className="p-4 bg-bluegray-500 flex flex-column flex-auto h-full">
      <div className="w-full flex justify-content-between">
        <TabMenu
          className="home-tabs"
          model={HOME_TABS}
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
          pt={{
            menuitem: {
              className: 'mr-2 h-2.6rem',
            },
          }}
        />
        <TabMenu
          className="logout"
          pt={{
            menu: {
              className: 'bg-none',
            },
          }}
          model={[
            {
              label: t('sts.btn.logout'),
              command: clearSession,
            },
          ]}
        />
      </div>
      <div className="bg-white p-4 pb-6 flex-auto h-full">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : (
              <ScrollPanel
                style={{ height: `${height}px`, width: '100%' }}
                pt={{
                  bary: {
                    className: 'bg-bluegray-300',
                  },
                }}
              >
                <Outlet />
              </ScrollPanel>
            );
          }}
        </AutoSizer>
      </div>
      <div className="absolute" style={{ bottom: 23, left: 16 }}>
        <h4 className="pl-4 mb-2">{getDocumentTitleInfo()}</h4>
      </div>
    </div>
  );
};

export default Home;
