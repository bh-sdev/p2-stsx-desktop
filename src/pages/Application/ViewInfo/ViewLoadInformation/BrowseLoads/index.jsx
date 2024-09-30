import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { reportsTop } from 'api/api.loads';
import { debounce, formatCol, onCopy } from 'utils';
import useTableSettings from 'hooks/useTableSettings';
import useWindowControl from 'hooks/useWindowControl';

import { GlobalContext } from 'pages/Application';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import TableBottom from './TableBottom';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_CELL_WIDTH, DEFAULT_ROW_HEIGHT } from 'const';

const BrowseLoads = () => {
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);
  const { id } = useParams();

  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  const [loadingTop, setLoadingTop] = useState(false);
  const [dataTop, setDataTop] = useState({});

  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);
  const tableRef = useRef();
  const lastTop = useRef(false);

  const { scrollToSelectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const { selectedCell, handleCellClick, setSelectedCell, selected, setSelected, onRowClick } =
    useTableNavigation({
      data: dataTop,
      tableRef,
      IDField: 'PK',
    });

  useEffect(() => {
    sendPost({ status: true, customData: { ready: true } });
    return () => {
      blockedAll && sendPost({ status: false });
    };
  }, []);

  const initTable = async (params = { Limit: 500, Offset: 0 }, scrollToSelected = false) => {
    setLoadingTop(true);
    try {
      const res = await reportsTop(id, {
        ...params,
        MarkNoDataCols: Boolean(query.get('hideEmptyCols')),
      });
      setDataTop(res);
      const arr = res.Entries || [];
      const foundSelected = arr?.find(({ PK }) => PK === selected?.[0]?.PK);
      const ind =
        !params.SortColAlias && selected?.length && foundSelected ? arr?.indexOf(foundSelected) : 0;
      const cur = arr[ind];
      setSelected([cur]);
      if (scrollToSelected) {
        scrollToSelectedIndex(ind);
      }
      if (!params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(res.TableID);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setLoadingTop(false);
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

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({
    tableRef,
  });

  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e, false),
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    initTable({ ...sortParams, Limit: dataTop.Entries.length }, true);
    lastTop.current = false;
  };

  const loadMoreTop = async (params) => {
    setLoadingTop(true);
    try {
      const res = await reportsTop(id, {
        ...tableSettingsParams,
        ...params,
        MarkNoDataCols: Boolean(query.get('hideEmptyCols')),
      });
      if (res.Entries.length) {
        setDataTop((prev) => ({ ...prev, Entries: [...prev.Entries, ...res.Entries] }));
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
      setLoadingTop(false);
    }
  };

  const onScrollIndexChangeTop = ({ last }) => {
    if (last === dataTop.Entries.length && !loadingTop && !lastTop.current) {
      loadMoreTop({ Limit: 500, Offset: last });
    }
  };

  const RenderTableTop = useMemo(() => {
    return !initialTableTopHeight ? null : (
      <DataTable
        ref={tableRef}
        onCopy={onCopy}
        removableSort
        loading={loadingTop}
        virtualScrollerOptions={{
          itemSize: DEFAULT_ROW_HEIGHT,
          onScrollIndexChange: onScrollIndexChangeTop,
        }}
        scrollHeight={`${initialTableTopHeight}px`}
        scrollable
        value={dataTop.Entries || []}
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        showGridlines
        size="small"
        style={{ fontSize: 12 }}
        selectionMode="single"
        cellSelection
        selection={selected}
        onCellClick={(e) => {
          handleCellClick(e.rowData, e.field);
          onRowClick(e);
        }}
        dataKey="PK"
        onSort={(e) => sortTable(e)}
        sortIcon={iconStatus}
        onColReorder={setOrderByColID}
        onColumnResizeEnd={setSizeByColID}
        rowClassName={(data) => {
          const isSelected = selected?.some((item) => item.PK === data.PK);
          if (isSelected) {
            return 'bg-gray-500';
          }
        }}
      >
        {dataTop.Cols?.map((col) => {
          const colSize = tableSettings?.Entries?.find(({ ID }) => ID === col.ID)?.Size || null;
          return col.NoData ? null : (
            <Column
              key={col.ID}
              columnKey={col.ID}
              headerTooltip={col.Name}
              headerTooltipOptions={{ position: 'top' }}
              field={col.ID}
              sortable
              bodyClassName={(_, { rowIndex }) =>
                +selectedCell.rowIndex === +rowIndex && String(selectedCell.field) === col.ID
                  ? 'selected-cell'
                  : ''
              }
              body={(rowData, { rowIndex }) => {
                const uniqueId = `cell-${rowIndex}-${col.ID}`;
                return (
                  <div id={uniqueId} tabIndex={0} style={{ width: colSize || DEFAULT_CELL_WIDTH }}>
                    {formatCol(rowData, col)}
                  </div>
                );
              }}
              header={col.Name}
              headerStyle={{ maxWidth: colSize || DEFAULT_CELL_WIDTH }}
            ></Column>
          );
        })}
      </DataTable>
    );
  }, [dataTop, loadingTop, tableSettings, selected, sortMeta, selectedCell, initialTableTopHeight]);

  return (
    <div className="flex-auto flex flex-column">
      <AutoSizer className="flex-auto w-full">
        {({ height }) => (
          <Splitter layout="vertical" style={{ height: `${height}px` }}>
            <SplitterPanel size={70} className="p-2">
              <div className="flex flex-column table h-full">
                <div className="flex-auto">
                  <AutoSizer disableWidth className="flex-auto w-full">
                    {({ height }) => {
                      height !== initialTableTopHeight &&
                        dbHeight(height, setInitialTableTopHeight);
                      return height !== initialTableTopHeight || emptyCols ? null : RenderTableTop;
                    }}
                  </AutoSizer>
                </div>
              </div>
            </SplitterPanel>
            <SplitterPanel className="p-2" minSize={30}>
              <TableBottom
                selected={selected?.[0]}
                renderTopTablePrefsButton={
                  <TableSettingsBtn
                    label="sts.btn.settings.top"
                    tableID={dataTop.TableID}
                    tableCurrentEntries={tableSettings?.Entries}
                    save={tableSettingsSave}
                    openFromRoutePath={window.opener?.name}
                  />
                }
              />
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default BrowseLoads;
