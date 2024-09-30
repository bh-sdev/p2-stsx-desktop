import React, { useRef, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { useTranslation } from 'react-i18next';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';

import JobInfo from './JobInfo';
import LoadInfo from './LoadInfo';
import useTabsNavigation from 'hooks/useTabsNavigation';

const EditJobInformation = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadInfo, setLoadInfo] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const { t } = useTranslation();
  const [withClosed, setWithClosed] = useState(false);
  const [data, setData] = useState([]);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editJobInfo);
  const props = {
    setWithClosed,
    withClosed,
    isNew,
    setIsNew,
    setIsEdit,
    isEdit,
    data,
    setData,
    setLoadInfo,
    Delete,
    Edit,
    Create,
  };

  const refTabView = useRef();

  useTabsNavigation({ refTabView, set: setActiveIndex, length: 2 });

  return (
    <TabView
      ref={refTabView}
      activeIndex={activeIndex}
      onTabChange={(e) => setActiveIndex(e.index)}
      pt={{
        root: {
          className: 'h-full flex flex-column',
        },
        navcontent: {
          className: 'h-3rem flex align-items-center',
          style: {
            border: '1px solid #dee2e6',
          },
        },
        panelcontainer: {
          className: 'h-full p-0',
        },
      }}
    >
      <TabPanel header={t('sts.tab.general')} key="tab1" className="h-full">
        <JobInfo {...props} />
      </TabPanel>
      <TabPanel
        disabled={isEdit || isNew}
        key="tab2"
        header={t('sts.tab.loadDetail')}
        className="h-full"
      >
        <LoadInfo loadInfo={loadInfo} />
      </TabPanel>
    </TabView>
  );
};

export default EditJobInformation;
