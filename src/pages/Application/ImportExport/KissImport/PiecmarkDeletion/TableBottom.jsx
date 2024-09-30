import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { kissImportReportsLoadsIdFileTransactions } from 'api/api.kiss';
import { GlobalContext } from 'pages/Application';
import { debounce, formatCol } from 'utils';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import ROUTER_PATH from 'const/router.path';
import useTableSettings from 'hooks/useTableSettings';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';
import useSelectByCheckbox from 'hooks/useSelectByCheckbox';

const TableBottom = ({
  selected,
  renderTopTablePrefsButton,
  renderFindData,
  purgeDelete,
  setPurgeTransactions,
  purgeTransactions,
  isChecked,
}) => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const [loadingBottom, setLoadingBottom] = useState(false);
  const [dataBottom, setDataBottom] = useState({});
  const [initialTableBottomHeight, setInitialTableBottomTopHeight] = useState(0);

  const { checkBoxSelectedOrigin, checkBoxSelect, checkBoxSelected, setCheckBoxSelected } =
    useSelectByCheckbox(dataBottom.Entries, 'PK');

  const tableRef = useRef();
  const lastBottom = useRef(false);

  const { selectedCell, setSelectedCell } = useTableNavigation({
    data: dataBottom,
    tableRef,
    IDField: 'ID',
  });

  const { sortMeta, sortParams, sortTableParams, iconStatus } = useSortTableAssist({
    tableRef,
  });

  useEffect(() => {
    setDataBottom({});
    if (selected?.length) {
      initTable({ Sort: sortParams, ...DEFAULT_LIMIT_LOAD_PARAMS });
    }
  }, [selected]);

  useEffect(() => {
    if (purgeDelete && dataBottom?.Entries?.length && isChecked) {
      if (!purgeTransactions?.[selected?.[0].PK]) {
        setPurgeTransactions((prevState) => {
          prevState[selected?.[0]?.PK] = dataBottom.Entries;
          return { ...prevState };
        });
        setCheckBoxSelected(
          dataBottom.Entries.reduce((a, data) => ({ ...a, [data.PK]: data }), {}),
        );
      } else {
        setCheckBoxSelected(
          purgeTransactions?.[selected?.[0].PK].reduce(
            (a, data) => ({ ...a, [data.PK]: data }),
            {},
          ),
        );
      }
    } else {
      setCheckBoxSelected({});
    }
  }, [purgeDelete, dataBottom, isChecked]);

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS) => {
    if (selected?.length && selected?.[0]?.PK) {
      setLoadingBottom(true);
      try {
        const res = await kissImportReportsLoadsIdFileTransactions({
          ...params,
          IdFileID: selected?.[0]?.PK,
        });
        if (!params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(res.TableID);
        setDataBottom(res);
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
  } = useTableSettings({ initTable, tableRef, notOrderFirst: true });

  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      IdFileID: selected.PK,
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
      const res = await kissImportReportsLoadsIdFileTransactions({
        ...tableSettingsParams,
        ...params,
        MarkNoDataCols: Boolean(query.get('hideEmptyCols')),
        IdFileID: selected.PK,
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

  const RenderTableBottom = useMemo(() => {
    return !initialTableBottomHeight ? null : (
      <DataTable
        id="select-print"
        ref={tableRef}
        removableSort
        loading={loadingBottom}
        virtualScrollerOptions={{
          itemSize: DEFAULT_ROW_HEIGHT,
          onScrollIndexChange,
        }}
        scrollHeight={`${initialTableBottomHeight}px`}
        scrollable
        value={dataBottom.Entries || []}
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        showGridlines
        size="small"
        selectionMode="checkbox"
        dataKey="PK"
        onSort={(e) => sortTable(e)}
        sortIcon={iconStatus}
        onColReorder={setOrderByColID}
        onColumnResizeEnd={setSizeByColID}
      >
        <Column
          key={'not_ordered'}
          columnKey={'not_ordered'}
          header={t('table.general.selection')}
          headerStyle={{ width: '10rem' }}
          reorderable={false}
          body={(rowData, { rowIndex }) => {
            return (
              <Checkbox
                onChange={(e) => {
                  checkBoxSelect(e, rowData, rowIndex, (data) => {
                    setPurgeTransactions((prevState) => {
                      prevState[selected?.[0]?.PK] = dataBottom.Entries?.filter(
                        ({ PK }) => data[PK],
                      );
                      return { ...prevState };
                    });
                  });
                }}
                checked={!!checkBoxSelectedOrigin[rowData.PK]}
                disabled={!purgeDelete || !isChecked}
              />
            );
          }}
        ></Column>
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
              body={(rowData, { rowIndex }) => {
                const uniqueId = `cell-${rowIndex}-${col.Alias}`;
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
  }, [
    purgeDelete,
    dataBottom,
    tableSettings,
    loadingBottom,
    sortMeta,
    checkBoxSelected,
    selectedCell,
    isChecked,
    initialTableBottomHeight,
  ]);

  return (
    <div className="flex flex-column table h-full">
      <div className="flex-auto">
        <AutoSizer disableWidth className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableBottomHeight && dbHeight(height, setInitialTableBottomTopHeight);
            return height !== initialTableBottomHeight || emptyCols ? null : RenderTableBottom;
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-3 p-2">
        {renderTopTablePrefsButton}
        <TableSettingsBtn
          label="sts.btn.settings.bottom"
          tableID={dataBottom.TableID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={ROUTER_PATH.browseLoads}
        />
        {renderFindData(checkBoxSelected.length)}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default memo(TableBottom);
