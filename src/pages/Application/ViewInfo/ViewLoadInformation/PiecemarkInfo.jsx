import { useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import { debounce, formatCol, onCopy } from 'utils';
import { loadReportPiecemerks } from 'api/api.loads';
import useTableSettings from 'hooks/useTableSettings';
import ROUTER_PATH from 'const/router.path';

import { GlobalContext } from 'pages/Application';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';

const PiecemarkInfo = ({ criteria, loadedInfo }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);
  const [loading, setLoading] = useState(0);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [piecemarks, setPiecemerks] = useState({});

  const tableRef = useRef();
  const lastPage = useRef(false);

  const { selectedCell, handleCellClick, setSelectedCell } = useTableNavigation({
    data: piecemarks,
    tableRef,
    IDField: 'PK',
  });

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS) => {
    setLoading(true);
    try {
      const res = await loadReportPiecemerks(loadedInfo.ID, {
        ...params,
        MarkNoDataCols: criteria.HideEmptyColumns,
      });
      if (!params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(res.TableID);
      setPiecemerks(res);
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

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const loadMore = async (params) => {
    setLoading(true);
    try {
      const res = await loadReportPiecemerks(loadedInfo.ID, {
        ...tableSettingsParams,
        ...params,
        MarkNoDataCols: criteria.HideEmptyColumns,
      });
      if (res.Entries.length) {
        setPiecemerks({ ...piecemarks, Entries: [...piecemarks.Entries, ...res.Entries] });
      } else {
        lastPage.current = true;
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

  const onScrollIndexChange = ({ last }) => {
    if (last === piecemarks.Entries.length && !loading && !lastPage.current) {
      loadMore({ Limit: 50, Offset: last });
    }
  };

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({
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
    initTable({ ...sortParams, Limit: piecemarks.Entries.length }, false);
    lastPage.current = false;
  };

  const RenderTable = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          ref={tableRef}
          removableSort
          onCopy={onCopy}
          loading={loading}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            items: 50,
            onScrollIndexChange,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={piecemarks.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          style={{ fontSize: 12 }}
          dataKey="PK"
          onSort={(e) => sortTable(e)}
          sortMode="single"
          sortIcon={iconStatus}
          onColReorder={setOrderByColID}
          onColumnResizeEnd={setSizeByColID}
          cellSelection
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
          }}
        >
          {piecemarks.Cols?.map((col) => {
            const colSize = tableSettings?.Entries?.find(({ ID }) => ID === col.ID)?.Size || null;
            return col.NoData ? null : (
              <Column
                key={col.ID}
                columnKey={col.ID}
                headerTooltip={col.Name}
                headerTooltipOptions={{ position: 'top' }}
                field={col.ID}
                sortable
                sortfield={col.ID}
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
    [piecemarks, loading, sortMeta, tableSettings, selectedCell],
  );

  return (
    <div className="flex flex-column table h-full">
      <div className="flex-auto">
        <AutoSizer disableWidth className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight || emptyCols ? null : RenderTable(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-3">
        <TableSettingsBtn
          tableID={piecemarks.TableID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={ROUTER_PATH.viewLoadInformation}
        />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default PiecemarkInfo;
