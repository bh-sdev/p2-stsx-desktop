import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import KissImportFile from './KissImportFile';
import KissImportTable from './KissImportTable';

import { kissJobRecords } from 'api/api.kiss';
import { GlobalContext } from 'pages/Application';
import ROUTER_PATH from 'const/router.path';
// import MOCK from './mock.json';

const KissImport = () => {
  const navigate = useNavigate();
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [importState, setImportState] = useState({});
  const [loaded, setLoaded] = useState(false);

  const JobID = searchParams.get('JobID');
  const with_settings = Boolean(searchParams.get('with_settings'));

  useEffect(() => {
    if (!loaded && JobID) {
      initImport();
    }
  }, [loaded, JobID]);

  const initImport = async () => {
    try {
      const res = await kissJobRecords({ job_id: JobID, with_settings });
      setImportState(res);
      setLoaded(true);
    } catch (e) {
      navigate(ROUTER_PATH.kissImport);
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  return !loaded && !JobID ? (
    <KissImportFile
      success={(data) => {
        setImportState(data);
        setLoaded(true);
      }}
    />
  ) : (
    <KissImportTable data={importState} />
  );
};

export default KissImport;
