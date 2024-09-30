import { useEffect, useRef, useState } from 'react';
import moment from 'moment';

import { classNames } from 'primereact/utils';

import { deleteReport, reportsTop } from 'api/api.recall.delete.records';
import useWindowControl from 'hooks/useWindowControl';

import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import Filters from './Filters';

const RecallDeleteRecords = () => {
  const { blockedAll } = useWindowControl(window.name, false);
  const [criteria, setCriteria] = useState(null);
  const [loadedInfo, setLoadedInfo] = useState({});
  const [refSuggestions, setRefSuggestions] = useState({});

  const selectedJob = useRef({});
  const refIsLoadedInfo = useRef({});
  const timeoutReportID = useRef(null);

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
    if (loadedInfo.ID) {
      refreshExpiration(reportsTop, timeoutReportID.current);
    }
    return () => {
      if (loadedInfo.ID) {
        deleteReport(loadedInfo.ID);
        clearInterval(timeoutReportID.current);
      }
    };
  }, [loadedInfo]);

  useEffect(
    () => () => {
      if (refIsLoadedInfo.current?.ID) {
        deleteReport(loadedInfo.ID);
      }
      if (timeoutReportID.current) {
        clearTimeout(timeoutReportID.current);
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
      <div className="flex justify-content-end align-items-center absolute right-0 top-0 z-1 mr-2 mt-2">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <Filters
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
      </div>
    </div>
  );
};

export default RecallDeleteRecords;
