import { useEffect, useRef, useState } from 'react';

import { deleteReport, reportsTop } from 'api/api.delActiveRecords';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import ViewPiecmarks from './ViewPiecmarks';
import moment from 'moment';
import { classNames } from 'primereact/utils';
import useWindowControl from 'hooks/useWindowControl';

const ActiveRecordsDelete = () => {
  const { blockedAll } = useWindowControl(window.name, false);
  const [criteria, setCriteria] = useState(null);
  const [loadedInfo, setLoadedInfo] = useState({});
  const [refSuggestions, setRefSuggestions] = useState({});

  const selectedJob = useRef({});
  const intervalReportID = useRef(null);

  const refreshExpiration = async (request, interval) => {
    try {
      const res = await request(loadedInfo.ID, { Limit: 0, Offset: 0 });
      clearInterval(interval);
      interval = null;
      interval = setInterval(
        () => refreshExpiration(request, interval),
        !res.ExpireOn ? 240000 : moment(res.ExpireOn).diff(new Date(), 'milliseconds') - 60 * 1000,
      );
    } catch (e) {
      clearInterval(interval);
      interval = null;
    }
  };

  useEffect(() => {
    if (loadedInfo.ID) {
      refreshExpiration(reportsTop, intervalReportID.current);
    }
    return () => {
      if (loadedInfo.ID) {
        deleteReport(loadedInfo.ID);
        clearInterval(intervalReportID.current);
      }
    };
  }, [loadedInfo]);

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
        <ViewPiecmarks
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

export default ActiveRecordsDelete;
