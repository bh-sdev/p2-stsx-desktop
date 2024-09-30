import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';

import { GlobalContext } from 'pages/Application';
import { debounce, formatCol, onCopy } from 'utils';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import ROUTER_PATH from 'const/router.path';
import useTableSettings from 'hooks/useTableSettings';
import { getPrintedTableBottom } from 'api/api.barcodeId';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';

const TableBottom = ({ selected, renderTopTablePrefsButton, renderFindData }) => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loadingBottom, setLoadingBottom] = useState(false);
  const [dataBottom, setDataBottom] = useState({});

  const [initialTableBottomHeight, setInitialTableBottomTopHeight] = useState(0);
  const tableRef = useRef();
  const lastBottom = useRef(false);

  const { sortMeta, sortParams, sortTableParams, iconStatus } = useSortTableAssist({
    tableRef,
  });

  useEffect(() => {
    if (selected) {
      initTable({ Sort: sortParams, ...DEFAULT_LIMIT_LOAD_PARAMS });
    }
  }, [selected]);

  const { selectedCell, handleCellClick, setSelectedCell } = useTableNavigation({
    data: dataBottom,
    tableRef,
    IDField: 'ID',
  });

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS) => {
    if (selected && selected?.IdfileID) {
      setLoadingBottom(true);
      try {
        const res = await getPrintedTableBottom({
          ...params,
          IdfileID: selected?.IdfileID,
        });
        setDataBottom(res);
        if (!params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(res.TableID);
      } catch (e) {
        refToast.current?.show({
          severity: 'error',
          summary: t('sts.txt.error'),
          detail: e.response.data.Message,
          life: 3000,
        });
      } finally {
        setLoadingBottom(false);
      }
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

  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      IdfileID: selected.IdfileID,
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    initTable({ ...sortParams, Limit: dataBottom.Entries.length }, false);
    lastBottom.current = false;
  };

  const loadMoreBottom = async (params) => {
    setLoadingBottom(true);
    try {
      const res = await getPrintedTableBottom({
        ...params,
        IdfileID: selected.IdfileID,
        ...tableSettingsParams,
      });
      if (res.Entries.length) {
        setDataBottom((prev) => ({ ...prev, Entries: [...prev.Entries, ...res.Entries] }));
      } else {
        lastBottom.current = true;
      }
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setLoadingBottom(false);
    }
  };

  const onScrollIndexChange = ({ last }) => {
    if (last === dataBottom.Entries.length && !loadingBottom && !lastBottom.current) {
      loadMoreBottom({ Limit: 50, Offset: last });
    }
  };

  const RenderTableBottom = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          ref={tableRef}
          removableSort
          onCopy={onCopy}
          loading={loadingBottom}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            items: 50,
            onScrollIndexChange,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={dataBottom.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          style={{ fontSize: 12 }}
          dataKey="ID"
          onSort={(e) => sortTable(e, false)}
          sortIcon={iconStatus}
          onColReorder={setOrderByColID}
          onColumnResizeEnd={setSizeByColID}
          cellSelection
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
          }}
        >
          {dataBottom.Cols?.map((col) => {
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
    [dataBottom, tableSettings, loadingBottom, sortMeta, selectedCell],
  );

  return (
    <div className="flex flex-column table h-full">
      <div className="flex-auto">
        <AutoSizer disableWidth className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableBottomHeight && dbHeight(height, setInitialTableBottomTopHeight);
            return height !== initialTableBottomHeight || emptyCols
              ? null
              : RenderTableBottom(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-3">
        {renderTopTablePrefsButton}
        <TableSettingsBtn
          label="sts.btn.settings.bottom"
          tableID={dataBottom.TableID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={ROUTER_PATH.barcodeIdLabel}
        />
        {renderFindData}
        <Button label={t('sts.btn.cancel')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default TableBottom;
