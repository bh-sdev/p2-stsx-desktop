import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { confirmDialog } from 'primereact/confirmdialog';

import {
  recordDelete,
  recordDeleteJob,
  recordDeleteTransactions,
  reportsTop,
} from 'api/api.delActiveRecords';
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
import useSelectByCheckbox from 'hooks/useSelectByCheckbox';

const PiecmarkDeletion = () => {
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);
  const { id } = useParams();
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { search } = useLocation();
  const { Delete } = useGetPermissions(ScreenId.activeRecordDeletes);
  const query = new URLSearchParams(search);

  const [loadingTop, setLoadingTop] = useState(false);
  const [dataTop, setDataTop] = useState({});
  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);
  const [purgeDelete, setPurgeDelete] = useState(false);
  const [purgeTransactions, setPurgeTransactions] = useState({});

  const { checkBoxSelectedOrigin, checkBoxSelected, setCheckBoxSelected, checkBoxSelect } =
    useSelectByCheckbox(dataTop.Entries, 'PK', 'TOP');

  const tableRef = useRef();
  const lastTop = useRef(false);

  useEffect(() => {
    sendPost({ status: true });
    initTable();
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
    setSelectedCell,
  } = useTableNavigation({
    data: dataTop,
    tableRef,
    IDField: 'PK',
  });

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS, option) => {
    setLoadingTop(true);
    try {
      const res = await reportsTop(id, {
        ...params,
        MarkNoDataCols: Boolean(query.get('hideEmptyCols')),
      });
      setDataTop(res);
      const arr = res.Entries || [];
      if (selected?.length) {
        const foundSelected = arr?.filter(({ PK }) =>
          selected?.find((selected) => selected?.PK === PK),
        );
        if (foundSelected.length) {
          setSelected(foundSelected);
        }
      } else {
        setSelected([arr?.[0]]);
        setFirstSelected(arr?.[0]);
        setLastSelected(arr?.[0]);
      }
      if (option === 'selectAll') {
        setCheckBoxSelected(res.Entries.reduce((a, data) => ({ ...a, [data.PK]: data }), {}));
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
  const onDeleteClick = async () => {
    confirmDialog({
      closable: false,
      header: t('sts.window.remove.selected'),
      message: t('sts.txt.delete.records.selected', {
        0: checkBoxSelected.length,
      }),
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.delete'),
      rejectClassName: 'p-button-primary',
      icon: 'pi pi-question-circle text-blue-400',
      reject: async () => {
        setTimeout(() => {
          confirmDialog({
            closable: false,
            message: t('1072'),
            acceptLabel: t('sts.btn.no'),
            acceptClassName: 'p-button-secondary',
            rejectLabel: t('sts.btn.yes'),
            rejectClassName: 'p-button-primary',
            accept: async () => {
              setLoadingTop(true);
              try {
                await recordDelete({
                  Entities: checkBoxSelected.map((el) => el.PK),
                  ReportID: id,
                });
                sendPost({ customData: { refetch: true } });
              } catch (e) {
                confirmDialog({
                  closable: false,
                  message: e.response.data.Detail,
                  header: e.response.data.Message,
                  acceptLabel: t('sts.btn.ok'),
                  rejectClassName: 'hidden',
                  icon: 'pi pi-times-circle text-yellow-500',
                });
              } finally {
                setLoadingTop(false);
              }
              setTimeout(() => {
                confirmDialog({
                  closable: false,
                  message: t('The deletion process has been completed.'),
                  header: t('The deletion process has been completed.'),
                  acceptLabel: t('sts.btn.ok'),
                  accept: async () => {
                    window.close();
                  },
                  rejectClassName: 'hidden',
                  icon: 'pi pi-info-circle text-green-500',
                });
              }, 100);
            },
            icon: 'pi pi-question-circle text-blue-400',
          });
        }, 100);
      },
    });
  };
  const onPurgeClick = async () => {
    confirmDialog({
      closable: false,
      header: t('sts.window.purge.selected'),
      message: t('sts.txt.delete.records.history'),
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.purge.selected'),
      rejectClassName: 'p-button-primary',
      icon: 'pi pi-question-circle text-blue-400',
      reject: async () => {
        setTimeout(() => {
          confirmDialog({
            closable: false,
            message: t('sts.txt.purge.process'),
            acceptLabel: t('sts.btn.no'),
            acceptClassName: 'p-button-secondary',
            rejectLabel: t('sts.btn.yes'),
            rejectClassName: 'p-button-primary',
            accept: async () => {
              setLoadingTop(true);
              try {
                recordDeleteTransactions({
                  ReportID: id,
                  TransactionsIDs: Object.values(purgeTransactions)
                    .flat()
                    .map(({ PK }) => PK),
                });
                sendPost({ customData: { refetch: true } });
                setTimeout(() => {
                  confirmDialog({
                    closable: false,
                    message: t('sts.text.purge.complete'),
                    acceptLabel: t('sts.btn.ok'),
                    accept: async () => {
                      window.close();
                    },
                    rejectClassName: 'hidden',
                    icon: 'pi pi-info-circle text-green-500',
                  });
                }, 100);
              } catch (e) {
                confirmDialog({
                  closable: false,
                  message: e.response.data.Detail,
                  header: e.response.data.Message,
                  acceptLabel: t('sts.btn.ok'),
                  rejectClassName: 'hidden',
                  icon: 'pi pi-times-circle text-yellow-500',
                });
              } finally {
                setLoadingTop(false);
              }
            },
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
  } = useTableSettings({ initTable, tableRef, notOrderFirst: true });

  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });
  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    initTable({ ...sortParams, Limit: dataTop.Entries.length }, false).then(() => {
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

  const purgeEntireJob = async () => {
    confirmDialog({
      closable: false,
      header: t('sts.chk.delete.job'),
      message: t('sts.text.purge.job'),
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.txt.purge'),
      rejectClassName: 'p-button-primary',
      icon: 'pi pi-question-circle text-blue-400',
      reject: async () => {
        setTimeout(() => {
          confirmDialog({
            closable: false,
            message: t('sts.text.purge.permanently'),
            acceptLabel: t('sts.btn.no'),
            acceptClassName: 'p-button-secondary',
            rejectLabel: t('sts.btn.yes'),
            rejectClassName: 'p-button-primary',
            accept: async () => {
              setLoadingTop(true);
              try {
                await recordDeleteJob({ job_id: query.get('jobID'), report_id: id });
                setTimeout(() => {
                  confirmDialog({
                    closable: false,
                    message: t('sts.text.purge.complete'),
                    acceptLabel: t('sts.btn.ok'),
                    accept: async () => {
                      window.close();
                    },
                    rejectClassName: 'hidden',
                    icon: 'pi pi-info-circle text-green-500',
                  });
                }, 100);
              } catch (e) {
                confirmDialog({
                  closable: false,
                  message: e.response.data.Detail,
                  header: e.response.data.Message,
                  acceptLabel: t('sts.btn.ok'),
                  rejectClassName: 'hidden',
                  icon: 'pi pi-times-circle text-yellow-500',
                });
              } finally {
                setLoadingTop(false);
              }
            },
            icon: 'pi pi-question-circle text-blue-400',
          });
        }, 100);
      },
    });
  };

  const RenderTableTop = useMemo(() => {
    return !initialTableTopHeight ? null : (
      <DataTable
        id="select-print"
        ref={tableRef}
        removableSort
        loading={loadingTop}
        onCopy={onCopy}
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
        selectionMode="checkbox"
        cellSelection
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
                  checkBoxSelect(e, rowData, rowIndex);
                }}
                checked={!!checkBoxSelectedOrigin[rowData.PK]}
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
    dataTop,
    loadingTop,
    tableSettings,
    selected,
    sortMeta,
    checkBoxSelected,
    selectedCell,
    initialTableTopHeight,
  ]);

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
                selected={selected}
                isChecked={!!checkBoxSelectedOrigin[selected?.[0]?.PK]}
                purgeDelete={purgeDelete}
                purgeTransactions={purgeTransactions}
                setPurgeTransactions={setPurgeTransactions}
                renderTopTablePrefsButton={
                  <>
                    <div className="flex align-items-center">
                      <Checkbox
                        disabled={!Delete}
                        inputId="DeleteRecords"
                        onChange={(e) => {
                          setPurgeDelete(e.checked);
                        }}
                        checked={purgeDelete}
                      />
                      <label htmlFor="DeleteRecords" className="ml-2">
                        {t('sts.checkbox.delete.records.history')}
                      </label>
                    </div>
                    <TableSettingsBtn
                      label="sts.btn.settings.top"
                      tableID={dataTop.TableID}
                      tableCurrentEntries={tableSettings?.Entries}
                      save={tableSettingsSave}
                      openFromRoutePath={ROUTER_PATH.browseLoads}
                    />
                  </>
                }
                renderFindData={(selectedLength) => (
                  <>
                    <Button
                      disabled={!dataTop.Entries?.length}
                      label={t('sts.btn.select.all')}
                      size="small"
                      onClick={() => {
                        initTable({ Limit: 10000 }, 'selectAll');
                      }}
                    />
                    <Button
                      disabled={
                        purgeDelete
                          ? !selectedLength
                          : !dataTop.Entries?.length || !checkBoxSelected.length || !Delete
                      }
                      label={
                        purgeDelete ? t('sts.btn.purge.history') : t('sts.btn.delete.selected')
                      }
                      size="small"
                      onClick={() => {
                        if (purgeDelete) {
                          onPurgeClick();
                        } else {
                          onDeleteClick();
                        }
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length}
                      label={t('sts.btn.highlighted')}
                      size="small"
                      onClick={() => {
                        setCheckBoxSelected((prevState) => ({
                          ...prevState,
                          ...selected.reduce((a, data) => ({ ...a, [data.PK]: data }), {}),
                        }));
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !Delete}
                      label={t('sts.chk.delete.job')}
                      size="small"
                      onClick={() => purgeEntireJob()}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !checkBoxSelected.length}
                      label={t('sts.btn.clear.all')}
                      size="small"
                      onClick={() => {
                        setCheckBoxSelected({});
                      }}
                    />
                  </>
                )}
              />
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default PiecmarkDeletion;
