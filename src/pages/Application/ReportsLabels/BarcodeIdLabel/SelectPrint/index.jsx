import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { debounce, formatCol, onCopy } from 'utils';
import { getPrintedTableTop, print } from 'api/api.barcodeId';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useWindowControl from 'hooks/useWindowControl';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';
import useGetPermissions from 'hooks/useGetPermissions';
import useTableSettings from 'hooks/useTableSettings';

import { GlobalContext } from 'pages/Application';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import TableBottom from './TableBottom';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';
import useSelectByCheckbox from 'hooks/useSelectByCheckbox';

const SelectPrint = () => {
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);
  const { id } = useParams();
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { Edit } = useGetPermissions(ScreenId.idLabels);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const [loadingTop, setLoadingTop] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [dataTop, setDataTop] = useState({});
  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);

  const { checkBoxSelectedOrigin, checkBoxSelected, setCheckBoxSelected, checkBoxSelect } =
    useSelectByCheckbox(dataTop.Entries);

  const tableRef = useRef();
  const lastTop = useRef(false);

  useEffect(() => {
    sendPost({ status: true, customData: { ready: true } });
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
  });

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS, option) => {
    setLoadingTop(true);
    try {
      const res = await getPrintedTableTop(id, {
        ...params,
      });
      setDataTop(res);
      const arr = res.Entries || [];
      if (selected?.length) {
        const foundSelected = arr?.filter(({ IdfileID }) =>
          selected?.find((selected) => selected?.IdfileID === IdfileID),
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
        setCheckBoxSelected(res.Entries.reduce((a, data) => ({ ...a, [data.IdfileID]: data }), {}));
      }
      if (option === 'unprinted') {
        setCheckBoxSelected(
          res.Entries.filter((el) => !el.Lprint).reduce(
            (a, data) => ({ ...a, [data.IdfileID]: data }),
            {},
          ),
        );
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
  } = useTableSettings({ initTable, tableRef, notOrderFirst: true });

  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

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
    initTable({ ...sortParams, Limit: dataTop.Entries.length }, false);
    lastTop.current = false;
  };

  const loadMoreTop = async (params) => {
    setLoadingTop(true);
    try {
      const res = await getPrintedTableTop(id, {
        ...tableSettingsParams,
        ...params,
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

  const onPrintPress = async () => {
    setIsPrintLoading(true);
    try {
      const data = {
        LabeLaseTemplate: queryParams.get('LabeLaseTemplate'),
        LabelName: queryParams.get('LabelName'),
        PcmkInstanceIDs: checkBoxSelected.map((el) => el.PK),
        PrinterName: queryParams.get('PrinterName'),
        UseBarTender: queryParams.get('UseBarTender') === 'true',
        UseLabeLase: queryParams.get('UseLabeLase') === 'true',
        WriteTempFile: queryParams.get('WriteTempFile') === 'true',
        TableID: id,
      };
      const res = await print(data);
      const idsFromServer = res.Prints.map((print) => print.PcmkInstanceID);

      setDataTop((prevDataTop) => {
        let newDataTop = { ...prevDataTop };

        newDataTop.Entries = prevDataTop.Entries.map((entry) => {
          if (idsFromServer.includes(entry.PK)) {
            return { ...entry, Lprint: true };
          }
          return entry;
        });

        return newDataTop;
      });
      confirmDialog({
        closable: false,
        message: t('sts.txt.labels.sent.to.printer.params', { 0: res.Prints?.length }),
        header: t('sts.txt.labels.sent.to.printer'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
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
      setIsPrintLoading(false);
    }
  };

  const RenderTableTop = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          id="select-print"
          ref={tableRef}
          removableSort
          onCopy={onCopy}
          loading={loadingTop}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            onScrollIndexChange: onScrollIndexChangeTop,
          }}
          dataKey="IdfileID"
          scrollHeight={`${height}px`}
          scrollable
          value={dataTop.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selection={checkBoxSelected}
          selectable
          selectionMode="checkbox"
          cellSelection
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
            onRowClick(e);
          }}
          rowClassName={(data) => {
            const isPrintSelected = !!checkBoxSelectedOrigin[data.IdfileID];
            const isSelected =
              data && selected?.some((item) => item && item.IdfileID === data.IdfileID);

            if (isSelected) {
              return 'bg-gray-500';
            }

            if (isPrintSelected && data.Lprint) {
              return 'red-table';
            }

            if (isPrintSelected && !data.Lprint) {
              return 'green-table';
            }

            if (data.Lprint) {
              return 'yellow-table';
            }
          }}
          onSort={sortTable}
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
                  onChange={(e) => checkBoxSelect(e, rowData, rowIndex)}
                  checked={!!checkBoxSelectedOrigin[rowData.IdfileID]}
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
    [dataTop, loadingTop, tableSettings, selected, sortMeta, checkBoxSelected, selectedCell],
  );
  return (
    <div className="flex-auto flex flex-column">
      <Dialog visible={isPrintLoading} style={{ minWidth: 400, height: 100 }} closable={false}>
        !{t('sts.txt.barcode.print.working')}!...
      </Dialog>
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
                selected={selected?.[0]}
                renderTopTablePrefsButton={
                  <TableSettingsBtn
                    label="sts.btn.settings.top"
                    tableID={dataTop.TableID}
                    tableCurrentEntries={tableSettings?.Entries}
                    save={tableSettingsSave}
                    openFromRoutePath={ROUTER_PATH.barcodeIdLabel}
                  />
                }
                renderFindData={
                  <>
                    <Button
                      disabled={!dataTop.Entries?.length || !Edit}
                      label={t('sts.btn.highlighted')}
                      size="small"
                      onClick={() => {
                        setCheckBoxSelected((prevState) => ({
                          ...prevState,
                          ...selected.reduce((a, data) => ({ ...a, [data.IdfileID]: data }), {}),
                        }));
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !Edit}
                      label={t('sts.btn.select.all')}
                      size="small"
                      onClick={() => {
                        initTable({ Limit: 10000 }, 'selectAll');
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !Edit}
                      label={t('sts.btn.select.unprinted')}
                      size="small"
                      onClick={() => {
                        initTable({ Limit: 10000 }, 'unprinted');
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !checkBoxSelected.length || !Edit}
                      label={t('sts.btn.clear.all')}
                      size="small"
                      onClick={() => {
                        setCheckBoxSelected({});
                      }}
                    />
                    <Button
                      disabled={!dataTop.Entries?.length || !Edit}
                      label={t('sts.btn.print')}
                      size="small"
                      onClick={() => onPrintPress()}
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

export default SelectPrint;
