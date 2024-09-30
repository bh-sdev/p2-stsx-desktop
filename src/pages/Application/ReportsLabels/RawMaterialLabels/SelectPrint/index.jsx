import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { debounce, formatCol, onCopy } from 'utils';
import { getPrintedTable, print } from 'api/api.raw.materials';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useWindowControl from 'hooks/useWindowControl';
import useTableSettings from 'hooks/useTableSettings';
import useGetPermissions from 'hooks/useGetPermissions';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';

import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import { GlobalContext } from 'pages/Application';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';
import useSelectByCheckbox from 'hooks/useSelectByCheckbox';

const SelectPrint = () => {
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);
  const { id } = useParams();
  const { Edit } = useGetPermissions(ScreenId.partLabels);
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const [loadingTop, setLoadingTop] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [dataTop, setDataTop] = useState({});
  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);

  const { checkBoxSelectedOrigin, checkBoxSelected, setCheckBoxSelected, checkBoxSelect } =
    useSelectByCheckbox(dataTop.Entries, 'PK');

  const tableRef = useRef();
  const lastTop = useRef(false);

  useEffect(() => {
    sendPost({ status: true });
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
      const res = await getPrintedTable(id, {
        ...params,
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
      if (option === 'unprinted') {
        setCheckBoxSelected(
          res.Entries.filter((el) => !el.Lprint).reduce(
            (a, data) => ({ ...a, [data.PK]: data }),
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
      const res = await getPrintedTable(id, {
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
        InventoryIDs: checkBoxSelected.map((el) => el.PK),
        PrinterName: queryParams.get('PrinterName'),
        UseBarTender: queryParams.get('UseBarTender') === 'true',
        UseLabeLase: queryParams.get('UseLabeLase') === 'true',
        WriteTempFile: queryParams.get('WriteTempFile') === 'true',
        TableID: id,
      };
      const res = await print(data);

      const idsFromServer = res.Prints.map((print) => print.InventoryID);

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
      initTable({ ...tableSettingsParams, Limit: dataTop.Entries.length }, false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.labels.sent.to.printer.params', { 0: res.Prints?.length }),
        header: t('sts.txt.labels.sent.to.printer'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          if (res.UpdateError) {
            setTimeout(() => {
              confirmDialog({
                closable: false,
                message: t('sts.unable.powerfab'),
                header: t('sts.unable.powerfab'),
                acceptLabel: t('sts.btn.ok'),
                rejectClassName: 'hidden',
                icon: 'pi pi-exclamation-triangle text-yellow-500',
              });
            }, 200);
          }
        },
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
          onRowClick={onRowClick}
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
            onRowClick(e);
          }}
          rowClassName={(data) => {
            const isPrintSelected = !!checkBoxSelectedOrigin[data.PK];
            const isSelected = data && selected?.some((item) => item && item.PK === data.PK);

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
          dataKey="PK"
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
                bodyClassName={(_, { rowIndex }) =>
                  +selectedCell.rowIndex === +rowIndex && String(selectedCell.field) === col.ID
                    ? 'selected-cell'
                    : ''
                }
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
    [dataTop, loadingTop, selected, sortMeta, tableSettings, checkBoxSelected, selectedCell],
  );

  return (
    <div className="h-full flex flex-column p-2">
      <Dialog visible={isPrintLoading} style={{ minWidth: 400, height: 100 }} closable={false}>
        !{t('sts.txt.barcode.print.working')}!...
      </Dialog>
      <div className="flex-auto flex flex-column">
        <AutoSizer disableWidth className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableTopHeight && dbHeight(height, setInitialTableTopHeight);
            return height !== initialTableTopHeight || emptyCols ? null : RenderTableTop(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-3">
        <TableSettingsBtn
          tableID={dataTop.TableID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={ROUTER_PATH.viewLoadInformation}
        />
        <Button
          disabled={!dataTop.Entries?.length || !Edit}
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
          disabled={!dataTop.Entries?.length || !Edit || !checkBoxSelected.length}
          label={t('sts.btn.print')}
          size="small"
          onClick={() => onPrintPress()}
        />
        <Button label={t('sts.btn.cancel')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default SelectPrint;
