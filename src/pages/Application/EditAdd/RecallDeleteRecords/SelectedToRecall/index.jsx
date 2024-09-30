import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { confirmDialog } from 'primereact/confirmdialog';

import { recallable, reportsTop } from 'api/api.recall.delete.records';
import { debounce, formatCol, onCopy } from 'utils';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useTableSettings from 'hooks/useTableSettings';
import useWindowControl from 'hooks/useWindowControl';
import useGetPermissions from 'hooks/useGetPermissions';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';

import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import { GlobalContext } from 'pages/Application';
import TableBottom from './TableBottom';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';

const SelectedToRecall = () => {
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);
  const { id } = useParams();
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { search } = useLocation();
  const { Edit } = useGetPermissions(ScreenId.deletedRecords);
  const query = new URLSearchParams(search);

  const [loadingTop, setLoadingTop] = useState(false);
  const [dataTop, setDataTop] = useState({});
  const [recallSelectedBottom, setRecallSelectedBottom] = useState(null);
  const [recallSelected, setRecallSelected] = useState([]);
  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);

  const tableTopRef = useRef();
  const lastTop = useRef(false);

  useEffect(() => {
    sendPost({ status: true });
    initTop();
    return () => {
      blockedAll && sendPost({ status: false });
    };
  }, []);

  const {
    onRowClick,
    handleCellClick,
    selected,
    setSelected,
    selectedCell,
    setFirstSelected,
    setLastSelected,
    activeColumnIndex,
    setSelectedCell,
  } = useTableNavigation({
    data: dataTop,
    tableRef: tableTopRef,
    IDField: 'PK',
  });

  const initTop = async (params = DEFAULT_LIMIT_LOAD_PARAMS, option) => {
    setLoadingTop(true);
    try {
      const res = await reportsTop(id, {
        ...params,
        MarkNoDataCols: Boolean(query.get('hideEmptyCols')),
      });
      setDataTop(res);
      const arr = res.Entries || [];
      const foundSelected = arr?.find(({ PK }) => PK === selected?.[0]?.PK);
      const ind = selected?.length && foundSelected ? arr?.indexOf(foundSelected) : 0;
      const cur = arr[ind];
      setSelected([cur]);
      setFirstSelected(cur);
      setLastSelected(cur);

      if (option === 'selectAll') {
        setTimeout(() => {
          setRecallSelected(res.Entries);
        }, 100);
      }
      if (!params.ColIDs && !tableSettings?.Entries) {
        await tableSettingsGet(res.TableID);
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

  const recallRequest = async () => {
    setLoadingTop(true);
    const recalledArrIDs = { Entities: recallSelected.map((el) => el.PK) };
    await recallable({ ...recalledArrIDs, ReportID: id });
    sendPost({ customData: { refetch: true } });
    setLoadingTop(false);
    sendPost({ customData: { refetch: true } });
    setTimeout(() => {
      confirmDialog({
        closable: false,
        message: t('The recall process has been completed.'),
        header: t('The recall process has been completed.'),
        acceptLabel: t('sts.btn.ok'),
        accept: async () => {
          window.close();
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }, 100);
  };

  const recall = async () => {
    confirmDialog({
      closable: false,
      header: t('sts.txt.recall.selected.records'),
      message: t('sts.txt.recall.records', {
        0: recallSelected.length,
      }),
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.recall.selected'),
      rejectClassName: 'p-button-primary',
      icon: 'pi pi-question-circle text-blue-400',
      reject: async () => {
        setTimeout(() => {
          confirmDialog({
            closable: false,
            message: t('sts.txt.recall.cancel'),
            acceptLabel: t('sts.btn.no'),
            acceptClassName: 'p-button-secondary',
            rejectLabel: t('sts.btn.yes'),
            rejectClassName: 'p-button-primary',
            accept: recallRequest,
            icon: 'pi pi-question-circle text-blue-400',
          });
        }, 100);
      },
    });
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
  } = useTableSettings({ initTable: initTop, tableRef: tableTopRef });

  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef: tableTopRef });
  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    initTop({ ...sortParams, Limit: dataTop.Entries.length }, false).then(() => {
      const updatedSelected = dataTop.Entries.filter((entry) =>
        selected?.some((sel) => sel.PK === entry.PK),
      );
      setSelected(updatedSelected);
    });
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
      loadMoreTop({ Limit: 50, Offset: last });
    }
  };

  const RenderTableTop = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          id="select-print"
          ref={tableTopRef}
          removableSort
          onCopy={onCopy}
          loading={loadingTop}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            onScrollIndexChange: onScrollIndexChangeTop,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={dataTop.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selectionMode="checkbox"
          cellSelection
          onRowClick={onRowClick}
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
            onRowClick(e);
          }}
          rowClassName={(data) => {
            const isSelected = selected?.some((item) => item.PK === data.PK);
            if (isSelected) {
              return 'bg-gray-500';
            }
          }}
          dataKey="PK"
          onSort={(e) => sortTable(e)}
          sortIcon={iconStatus}
          onColReorder={(e) =>
            setOrderByColID({ ...e, dragIndex: e.dragIndex - 1, dropIndex: e.dropIndex - 1 })
          }
          onColumnResizeEnd={setSizeByColID}
        >
          <Column
            header={t('table.general.selection')}
            headerStyle={{ width: '10rem' }}
            reorderable={false}
            body={(rowData) => {
              return (
                <Checkbox
                  onChange={(e) => {
                    if (e.checked) {
                      setRecallSelected((prevState) => [...prevState, rowData]);
                    } else {
                      setRecallSelected((prevState) =>
                        prevState.filter(({ PK }) => PK !== rowData.PK),
                      );
                    }
                  }}
                  checked={!!recallSelected.find(({ PK }) => PK === rowData.PK)}
                />
              );
            }}
          ></Column>
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
                    <div
                      id={uniqueId}
                      tabIndex={0}
                      style={{ width: colSize || DEFAULT_CELL_WIDTH }}
                    >
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
    },
    [
      dataTop,
      loadingTop,
      tableSettings,
      selected,
      sortMeta,
      recallSelected,
      activeColumnIndex,
      selectedCell,
    ],
  );

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
                      return height !== initialTableTopHeight || emptyCols
                        ? null
                        : RenderTableTop(height);
                    }}
                  </AutoSizer>
                </div>
              </div>
            </SplitterPanel>
            <SplitterPanel className="p-2" minSize={30}>
              <TableBottom
                selected={selected}
                recallSelected={recallSelected}
                setRecallSelectedBottom={setRecallSelectedBottom}
                recallSelectedBottom={recallSelectedBottom}
                renderTopTablePrefsButton={
                  <>
                    <TableSettingsBtn
                      label="sts.btn.settings.top"
                      tableID={dataTop.TableID}
                      tableCurrentEntries={tableSettings?.Entries}
                      save={tableSettingsSave}
                      openFromRoutePath={ROUTER_PATH.browseLoads}
                    />
                  </>
                }
                renderFindData={
                  <>
                    <Button
                      disabled={!dataTop.Entries?.length}
                      label={t('sts.btn.select.all')}
                      size="small"
                      onClick={() => {
                        initTop({ Limit: 10000 }, 'selectAll');
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !recallSelected.length}
                      label={t('sts.btn.clear.all')}
                      size="small"
                      onClick={() => {
                        setRecallSelected([]);
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !recallSelected.length || !Edit}
                      label={t('sts.btn.recall.selected')}
                      size="small"
                      onClick={recall}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length}
                      label={t('sts.btn.highlighted')}
                      size="small"
                      onClick={() => {
                        setRecallSelected((prevState) => {
                          const existingPKs = prevState.map((item) => item.PK);

                          const uniqueSelected = selected.filter(
                            (item) => !existingPKs.includes(item.PK),
                          );

                          return [...prevState, ...uniqueSelected];
                        });
                      }}
                    />
                  </>
                }
              />
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default SelectedToRecall;
