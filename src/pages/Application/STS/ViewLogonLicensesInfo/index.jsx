import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { classNames } from 'primereact/utils';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';

import { debounce, onCopy, time } from 'utils';
import { viewLogsLicenseGet, viewLogsLicenseSessionDelete } from 'api';
import { GlobalContext } from 'pages/Application';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const ViewLogonLicensesInfo = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState({});
  const [selected, setSelected] = useState({});
  const [initialTableHeight, setInitialTableHeight] = useState(0);

  const tableRef = useRef();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const res = await viewLogsLicenseGet();
      setInfo(res);
      setSelected(res.Sessions.find(({ IsCurrentSession }) => IsCurrentSession));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const clearSession = (ID) => {
    confirmDialog({
      closable: false,
      header: t('sts.txt.kill.off.client'),
      message: t('sts.txt.kill.client'),
      acceptLabel: t('sts.btn.no'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.yes'),
      rejectClassName: 'secondary',
      icon: 'pi pi-question-circle text-blue-400',
      reject: async () => {
        setLoading(true);
        try {
          await viewLogsLicenseSessionDelete(ID);
          init();
        } catch (e) {
          refToast.current?.show({
            severity: 'error',
            summary: t('sts.txt.error'),
            detail: e.response.data.Message,
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  const RenderTable = useCallback(
    (height) => {
      return (
        <DataTable
          ref={tableRef}
          onCopy={onCopy}
          removableSort
          loading={loading}
          scrollHeight={`${height}px`}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
          }}
          scrollable
          value={info.Sessions}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          dataKey="SessionID"
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.general.application.stop')}
            headerTooltipOptions={{ position: 'top' }}
            sortable
            header={t('table.general.application.stop')}
            body={({ SessionID, IsCurrentSession }) => (
              <Button
                disabled={IsCurrentSession}
                className="w-full"
                label={t('table.general.application.stop')}
                size="small"
                onClick={() => clearSession(SessionID)}
              />
            )}
          ></Column>
          <Column
            headerTooltip={t('table.employee.name')}
            headerTooltipOptions={{ position: 'top' }}
            field={'EmployeeName'}
            sortable
            header={t('table.employee.name')}
          ></Column>
          <Column
            headerTooltip={t('table.general.application.name')}
            headerTooltipOptions={{ position: 'top' }}
            field={'Program'}
            sortable
            header={t('table.general.application.name')}
          ></Column>
          <Column
            headerTooltip={t('table.general.ip.address')}
            headerTooltipOptions={{ position: 'top' }}
            field={'IPAddress'}
            sortable
            header={t('table.general.ip.address')}
          ></Column>
          <Column
            headerTooltip={t('table.general.login.time')}
            headerTooltipOptions={{ position: 'top' }}
            field={'LoginDate'}
            sortable
            header={t('table.general.login.time')}
            body={({ LoginDate }) =>
              `${moment(LoginDate).format('l')} ${moment(LoginDate).format('LT')}`
            }
          ></Column>
          <Column
            headerTooltip={t('table.general.logged.time')}
            headerTooltipOptions={{ position: 'top' }}
            field={'LoggedTimeSec'}
            sortable
            header={t('table.general.logged.time')}
            body={({ LoggedTimeSec }) => time(LoggedTimeSec)}
          ></Column>
          <Column
            headerTooltip={t('table.general.idle.time')}
            headerTooltipOptions={{ position: 'top' }}
            field={'IdleTimeSec'}
            sortable
            header={t('table.general.idle.time')}
            body={({ IdleTimeSec }) => time(IdleTimeSec)}
          ></Column>
          <Column
            headerTooltip={t('sts.label.employee.num')}
            headerTooltipOptions={{ position: 'top' }}
            field={'EmployeeNumber'}
            sortable
            header={t('sts.label.employee.num')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.login.name')}
            headerTooltipOptions={{ position: 'top' }}
            field={'LoginName'}
            sortable
            header={t('sts.label.login.name')}
          ></Column>
          <Column
            headerTooltip={t('table.general.division')}
            headerTooltipOptions={{ position: 'top' }}
            field={'Division'}
            sortable
            header={t('table.general.division')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.user.id')}
            headerTooltipOptions={{ position: 'top' }}
            field={'UserID'}
            sortable
            header={t('sts.label.user.id')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.session.id')}
            headerTooltipOptions={{ position: 'top' }}
            field={'SessionID'}
            sortable
            header={t('sts.label.session.id')}
          ></Column>
        </DataTable>
      );
    },
    [info, loading, selected, sortMeta],
  );

  return (
    <div
      className={classNames({
        fadein: true,
        'p-2': true,
        'h-full': true,
      })}
    >
      <div className="flex flex-column table h-full">
        <h4>{t('sts.txt.this.session.login.credentials')}:</h4>
        <div className="flex flex-column">
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.employee')}:</h4>
              <div>{selected?.EmployeeName}</div>
            </div>
            <div className="mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.employee.num')}:</h4>
              <div>{selected?.EmployeeNumber}</div>
            </div>
          </div>
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.login.name')}:</h4>
              <div>{selected?.LoginName}</div>
            </div>
            <div className="mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.user.id')}:</h4>
              <div>{selected?.UserID}</div>
            </div>
          </div>
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.login.date')}:</h4>
              <div>{`${moment(selected?.LoginDate).format('l')} ${moment(
                selected?.LoginDate,
              ).format('LT')}`}</div>
              <div className="ml-4 flex align-items-center">
                <div className="mr-4">{time(selected?.LoggedTimeSec)}</div>
              </div>
            </div>
          </div>
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.division')}:</h4>
              <div>{selected?.Division}</div>
            </div>
          </div>
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.login.program')}:</h4>
              <div>{selected?.Program}</div>
            </div>
          </div>
          <div className="flex align-items-center mb-2">
            <div className="w-25rem mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.ip.address')}:</h4>
              <div>{selected?.IPAddress}</div>
            </div>
            <div className="mr-4 flex align-items-center">
              <h4 className="w-7rem m-0 mr-4">{t('sts.label.session.id')}:</h4>
              <div>{selected?.SessionID}</div>
            </div>
          </div>
        </div>
        <div className="flex align-items-center justify-content-between mt-4">
          <h4>
            {info?.Sessions?.length} {t('sts.label.current.sessions')}:
          </h4>
          <div>
            {t('sts.txt.misc.idle.time.max')} {info?.MaximumIdleTimeMin}
          </div>
        </div>
        <div className="flex-auto">
          <AutoSizer className="flex-auto w-full">
            {({ height }) => {
              height !== initialTableHeight && dbHeight(height);
              return height !== initialTableHeight ? null : RenderTable(height);
            }}
          </AutoSizer>
        </div>
        <div className="flex align-items-center justify-content-end gap-2 mt-3">
          <Button label={t('sts.btn.refresh')} size="small" onClick={init} />
          <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
        </div>
      </div>
    </div>
  );
};

export default ViewLogonLicensesInfo;
