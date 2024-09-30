import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { TabPanel, TabView } from 'primereact/tabview';
import { classNames } from 'primereact/utils';

import { deleteReport, loadReportPiecemerks, reportsTop, loadStatusSummary } from 'api/api.loads';
import useWindowControl from 'hooks/useWindowControl';

import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import ViewLoadsCriteria from './ViewLoadsCriteria';
import PiecemarkInfo from './PiecemarkInfo';
import SummaryInfo from './SummaryInfo';
import useTabsNavigation from 'hooks/useTabsNavigation';

const ViewLoadInformation = () => {
  const { blockedAll } = useWindowControl(window.name, false);
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [criteria, setCriteria] = useState(null);
  const [loadedInfo, setLoadedInfo] = useState({});
  const [refSuggestions, setRefSuggestions] = useState({});

  const selectedJob = useRef({});
  const refIsLoadedInfo = useRef({});
  const timeoutPiecemarksID = useRef(null);
  const timeoutReportID = useRef(null);
  const timeoutSummeryID = useRef(null);
  const refTabView = useRef(null);

  useTabsNavigation({ refTabView, set: setActiveIndex, length: 3 });

  const refreshExpiration = async (request, interval, params) => {
    try {
      const res = await request(loadedInfo.ID, params);
      clearTimeout(interval);
      interval = null;
      interval = setTimeout(
        () => refreshExpiration(request, interval, params),
        !res.ExpireOn ? 240000 : moment(res.ExpireOn).diff(new Date(), 'milliseconds') - 60 * 1000,
      );
    } catch (e) {
      clearTimeout(interval);
      interval = null;
    }
  };

  useEffect(() => {
    refIsLoadedInfo.current = loadedInfo;
    if (loadedInfo.Pieces) {
      refreshExpiration(loadReportPiecemerks, timeoutPiecemarksID.current, { Limit: 0, Offset: 0 });
      refreshExpiration(reportsTop, timeoutReportID.current, { Limit: 0, Offset: 0 });
      refreshExpiration(loadStatusSummary, timeoutSummeryID.current);
    }
  }, [loadedInfo]);

  useEffect(
    () => () => {
      if (refIsLoadedInfo.current?.ID) {
        deleteReport(loadedInfo.ID);
      }
      if (timeoutPiecemarksID.current || timeoutReportID.current || timeoutSummeryID.current) {
        clearTimeout(timeoutPiecemarksID.current);
        clearTimeout(timeoutReportID.current);
        clearTimeout(timeoutSummeryID.current);
      }
    },
    [],
  );

  return (
    <div
      className={classNames({
        flex: true,
        'flex-column': true,
        'px-2': true,
        'pt-2': true,
        'h-full': true,
        'p-disabled': blockedAll,
      })}
    >
      <div className="flex justify-content-end align-items-center absolute right-0 top-0 z-5 mr-2 mt-2">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
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
            },
            panelcontainer: {
              className: 'py-2 px-0 h-full',
            },
          }}
        >
          <TabPanel header={t('sts.tab.load.criteria')} className="h-full">
            <ViewLoadsCriteria
              selectedJob={selectedJob.current}
              getSelectedJob={(data) => {
                selectedJob.current = data;
              }}
              loadedInfo={loadedInfo}
              getLoadedInfo={setLoadedInfo}
              criteria={criteria}
              getCriteria={setCriteria}
              refSuggestions={refSuggestions}
              setRefSuggestions={setRefSuggestions}
            />
          </TabPanel>
          <TabPanel
            disabled={!loadedInfo.ID}
            header={t('sts.tab.piecemark.info')}
            className="h-full"
          >
            <PiecemarkInfo criteria={criteria} loadedInfo={loadedInfo} />
          </TabPanel>
          <TabPanel
            disabled={!loadedInfo.ID}
            header={t('sts.tab.load.status.summary')}
            className="h-full"
          >
            <SummaryInfo criteria={criteria} loadedInfo={loadedInfo} />
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default ViewLoadInformation;
