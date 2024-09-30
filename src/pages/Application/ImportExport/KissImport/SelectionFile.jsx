import { memo, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';

import { kissFiles } from 'api/api.kiss';
import { GlobalContext } from 'pages/Application';

const SelectionFile = ({ isFileSelect, setIsFileSelect, selectedFile }) => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const refFiles = useRef([]);
  const refList = useRef(null);

  useEffect(() => {
    isFileSelect && init();
  }, [isFileSelect]);

  useEffect(() => {
    const scrollWheel = (evt) => {
      evt.preventDefault();
      refList.current.scrollLeft += evt.deltaY;
    };
    refList.current?.addEventListener('wheel', scrollWheel);
    return () => {
      refList.current?.removeEventListener('wheel', scrollWheel);
    };
  }, [files]);

  const init = async () => {
    setBusy(true);
    try {
      const { Entries } = await kissFiles();
      setFiles(Entries);
      refFiles.current = Entries;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Detail,
        life: 3000,
      });
    } finally {
      setBusy(false);
    }
  };

  const matchFile = (value) => {
    setFiles(refFiles.current.filter((file) => file.toLowerCase().includes(value.toLowerCase())));
  };

  const select = () => {
    selectedFile(selected);
    close();
  };

  const renderFiles = ({ height }) => {
    return busy ? (
      <div className="h-full flex justify-content-center align-items-center">
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          pt={{
            circle: { style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' } },
          }}
        />
      </div>
    ) : (
      <ul ref={refList} className="p-0 m-0" style={{ height, overflowX: 'hidden', columns: 3 }}>
        {files.map((file, index) => (
          <div key={file} className="flex align-items-center">
            <span>{index + 1}:</span>
            <h5
              className={`p-2 m-0 cursor-pointer ${selected === file ? 'bg-gray-200' : ''}`}
              style={{ wordBreak: 'break-all' }}
              onClick={() => setSelected(file)}
              onDoubleClick={() => {
                selectedFile(selected);
                close();
              }}
            >
              {file}
            </h5>
          </div>
        ))}
      </ul>
    );
  };

  const close = () => {
    if (!selected) {
      confirmDialog({
        closable: false,
        message: t('1300'),
        header: 1300,
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          setIsFileSelect(false);
          setSelected(null);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
      return;
    }
    setIsFileSelect(false);
    setSelected(null);
  };

  return (
    <Dialog
      visible={isFileSelect}
      style={{ width: '90vw', height: '60vw' }}
      onHide={close}
      closable={false}
      header={
        <div className="flex align-items-center text-base">
          <span className="mr-2">{t('look.in')}:</span>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <span className="text-base flex align-items-center">
                <i className="pi pi-folder mr-2"></i>
                {t('sts.btn.import').toLowerCase()}\
              </span>
            </span>
            <InputText onChange={(e) => matchFile(e.target.value)} />
          </div>
        </div>
      }
      footer={
        <>
          <Button
            loading={busy}
            disabled={!selected}
            label={t('sts.btn.ok')}
            size="small"
            onClick={select}
          />
          <Button label={t('sts.btn.cancel')} size="small" onClick={close} />
        </>
      }
    >
      <div className="w-full flex flex-column h-full">
        <AutoSizer className="flex-auto w-full">{renderFiles}</AutoSizer>
      </div>
    </Dialog>
  );
};

export default memo(SelectionFile);
