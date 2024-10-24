import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';

import { debounce, formatCol, onCopy } from 'utils';
import { GlobalContext } from 'pages/Application';
import { getLogs } from 'api/api.logs';
import { Button } from 'primereact/button';
import useActions from 'hooks/useActions';
import ROUTER_PATH from 'const/router.path';
import useWindowControl from 'hooks/useWindowControl';
import { removeEmptyParams } from 'api/general';
import TableSettingsBtn from '../../components/TableSettingsBtn';
import useTableSettings from 'hooks/useTableSettings';
import { classNames } from 'primereact/utils';
import { confirmDialog } from 'primereact/confirmdialog';
import GoToRootWindow from '../../components/GoToRootWindow';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ServiceTokenStorage as TokenStorageService } from 'services';
import axios from 'axios';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';
import { DEFAULT_CELL_WIDTH, DEFAULT_ROW_HEIGHT } from 'const';
import { API_CONFIG } from 'configs';

const ViewLog = () => {
  const { sendPost, receivedData, blockedAll } = useWindowControl(
    ROUTER_PATH.viewLogFilters,
    false,
  );
  const { refToast } = useContext(GlobalContext);
  const { addHistoryLink } = useActions();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [data, setData] = useState([]);
  const [filtersData, setFiltersData] = useState(null);
  const [sortParams, setSortParams] = useState(null);
  const tableRef = useRef();
  const [lastUpdate, setLastUpdate] = useState(moment().format('h:mm:ss A'));
  const lastTop = useRef(false);

  const { selectedCell, handleCellClick, setSelectedCell } = useTableNavigation({
    data: data,
    tableRef,
    IDField: 'PK',
  });

  useEffect(() => {
    function hasOnlyReadyField(obj) {
      if (Object.keys(obj).length === 1) {
        return 'ready' in obj;
      }
      return false;
    }
    if (receivedData) {
      if (hasOnlyReadyField(receivedData)) {
        sendPost({ customData: filtersData });
      } else {
        initTable({ ...tableSettingsParams, ...sortParams }, receivedData);
        setFiltersData(receivedData);
      }
    }
  }, [receivedData]);

  const initTable = async (params = { Limit: 100 }, filters, sortParams) => {
    setLoading(true);
    let dataLogs;
    const Params = { Limit: 100, ...params, ...sortParams };
    try {
      if (filters) {
        dataLogs = await getLogs({
          Params,
          Filters: removeEmptyParams(filters),
        });
      } else {
        dataLogs = await getLogs({
          Params,
          Filters: { ...filtersData },
        });
      }
      if (!Params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(dataLogs.TableID);
      setData(dataLogs);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
      setData([]);
    } finally {
      setLoading(false);
      setLastUpdate(moment().format('h:mm:ss A'));
    }
  };
  const {
    emptyCols,
    tableSettings,
    tableSettingsGet,
    tableSettingsSave,
    setSizeByColID,
    setOrderByColID,
    tableSettingsParams,
    setTableSettingsParams,
  } = useTableSettings({ initTable, tableRef });

  const loadDataLazy = async (params) => {
    setLoading(true);
    try {
      const dataLogs = await getLogs({
        ...(filtersData ? { Filters: { ...removeEmptyParams(filtersData) } } : null),
        Params: {
          ...tableSettingsParams,
          ...sortParams,
          ...params,
        },
      });
      if (dataLogs.Entries.length) {
        setData((prev) => ({ ...prev, Entries: [...prev.Entries, ...dataLogs.Entries] }));
      } else {
        lastTop.current = true;
      }
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
  const exportExcel = () => {
    setExportLoading(true);
    axios({
      // url: `${process.env.REACT_APP_API_ROOT}logs/export`,
      url: `${API_CONFIG.baseURL}logs/export`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TokenStorageService.getToken()}`,
      },
      responseType: 'blob',
      data: {
        Filters: { ...filtersData },
        Params: {
          ColIDs: tableSettings.Entries.map((col) => col.ID),
          ClientTime: moment().format(),
          ...sortParams,
        },
      },
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `viewlog_${moment(moment()).format('YYYYMDD')}_${moment(moment()).format('HHmmss')}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((e) => {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      })
      .finally(() => {
        setExportLoading(false);
      });
  };

  const { sortTableParams, iconStatus, sortMeta } = useSortTableAssist({
    tableRef,
  });

  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    setSortParams(sortParams);
    initTable({}, null, sortParams);
  };

  const onFiltersClick = () => {
    addHistoryLink({
      title: t('sts.btn.filters'),
      path: `${window.origin}/${ROUTER_PATH.viewLogFilters}`,
      singleID: `${window.origin}/${ROUTER_PATH.viewLogFilters}`,
      multiple: false,
      single: true,
    });
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const onScrollIndexChange = ({ last }) => {
    if (last === data?.Entries?.length && !loading && !lastTop.current) {
      loadDataLazy({ Limit: 100, Offset: last });
    }
  };

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
            onScrollIndexChange,
          }}
          scrollable
          value={data.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          dataKey="PK"
          sortIcon={iconStatus}
          onSort={(e) => sortTable(e, false)}
          onColReorder={setOrderByColID}
          onColumnResizeEnd={setSizeByColID}
          cellSelection
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
          }}
        >
          {data?.Cols?.map((col) => {
            const colSize = tableSettings?.Entries?.find(({ ID }) => ID === col.ID)?.Size || null;
            return col.NoData ? null : (
              <Column
                key={col.ID}
                columnKey={col.ID}
                headerTooltip={col.Name}
                headerTooltipOptions={{ position: 'top' }}
                field={col.ID}
                sortable
                bodyClassName={(_, { rowIndex }) => {
                  return `${
                    +selectedCell.rowIndex === +rowIndex && String(selectedCell.field) === col.ID
                      ? 'selected-cell'
                      : ''
                  }`;
                }}
                body={(rowData, { rowIndex }) => (
                  <div
                    id={`cell-${rowIndex}-${col.Alias}`}
                    tabIndex={0}
                    style={{ width: colSize || DEFAULT_CELL_WIDTH }}
                  >
                    {formatCol(rowData, col)}
                  </div>
                )}
                header={col.Name}
                headerStyle={{ maxWidth: colSize || DEFAULT_CELL_WIDTH }}
              ></Column>
            );
          })}
        </DataTable>
      );
    },
    [loading, data, sortMeta, tableSettings, selectedCell],
  );

  return (
    <div
      className={classNames({
        fadein: true,
        'p-2': true,
        'h-full': true,
        'p-disabled': blockedAll,
      })}
    >
      <div className="flex flex-column table h-full">
        <div className="flex justify-content-end">
          <GoToRootWindow />
        </div>
        {exportLoading && (
          <div
            className="h-full flex justify-content-center align-items-center absolute w-full z-5 bg-black-alpha-10"
            style={{ background: 'transparent' }}
          >
            <ProgressSpinner
              style={{ width: '50px', height: '50px' }}
              pt={{
                circle: {
                  style: {
                    stroke: 'var(--primary-900)',
                    strokeWidth: 3,
                    animation: 'none',
                  },
                },
              }}
            />
          </div>
        )}
        <div className="flex-auto">
          <AutoSizer className="flex-auto w-full">
            {({ height }) => {
              height !== initialTableHeight && dbHeight(height);
              return height !== initialTableHeight || emptyCols ? null : RenderTable(height);
            }}
          </AutoSizer>
        </div>
        <div className="flex align-items-center justify-content-end gap-2 mt-3">
          <div>
            {t('sts.txt.time.last.update')} {lastUpdate}
          </div>
          <TableSettingsBtn
            tableID={data.TableID}
            label="sts.btn.table.settings"
            tableCurrentEntries={tableSettings?.Entries}
            save={tableSettingsSave}
            openFromRoutePath={ROUTER_PATH.viewLogFilters}
          />
          <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
          <Button
            label={t('sts.btn.filters')}
            size="small"
            severity="secondary"
            onClick={onFiltersClick}
          />
          <Button
            label={t('sts.btn.export.prefs')}
            size="small"
            severity="secondary"
            onClick={exportExcel}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewLog;
