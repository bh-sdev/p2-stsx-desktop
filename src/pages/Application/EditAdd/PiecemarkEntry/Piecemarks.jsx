import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';

import { piecemarkEntryListGet } from 'api';
import { debounce, onCopy } from 'utils';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableNavigation from 'hooks/useTableNavigation';

import { GlobalContext } from 'pages/Application';
import { ContextPiecemarkEntry } from '.';
import { DEFAULT_ROW_HEIGHT } from 'const';

const Piecemarks = () => {
  const { t } = useTranslation();
  const { isEdit, isNew, job, selected, setSelected, setTableData, tableData } =
    useContext(ContextPiecemarkEntry);
  const { refToast } = useContext(GlobalContext);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [loading, setLoading] = useState(false);

  const tableRef = useRef();

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });
  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  useEffect(() => {
    if (job.ID) init();
  }, [job]);

  useEffect(() => {
    scrollToSelectedIndex(tableData.indexOf(selected));
  }, [tableData]);

  const init = async () => {
    try {
      setLoading(true);
      const { Entries } = await piecemarkEntryListGet({ job_id: job.ID });
      if (Entries.length) setSelected(Entries.at(0));
      setTableData(Entries);
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
    setTimeout(scrollToSelectedIndex, 1000);
  });

  const RenderTable = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          ref={tableRef}
          onCopy={onCopy}
          removableSort
          loading={loading}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={tableData}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          dataKey="ID"
          selectionMode="single"
          selection={selected}
          onRowClick={(e) => {
            if (!isNew && !isEdit) selectedIndex.current = e.index;
          }}
          onSelectionChange={(e) => {
            if (!isNew && !isEdit) {
              setSelected(e.value);
            }
          }}
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('sts.label.id.number')}
            headerTooltipOptions={{ position: 'top' }}
            field="IDSerialNumber"
            sortable
            header={t('sts.label.id.number')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.sheet.num')}
            headerTooltipOptions={{ position: 'top' }}
            field="SheetNumber"
            sortable
            header={t('sts.label.sheet.num')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.parent')}
            headerTooltipOptions={{ position: 'top' }}
            field="ParentPiecemark"
            sortable
            header={t('sts.label.parent')}
          ></Column>
          <Column
            headerTooltip={t('sts.label.piecemark')}
            headerTooltipOptions={{ position: 'top' }}
            field="Piecemark"
            sortable
            header={t('sts.label.piecemark')}
          ></Column>
        </DataTable>
      );
    },
    [tableData, selected, loading, isNew, isEdit, sortMeta],
  );

  return (
    <div className="flex flex-column table h-full">
      <div className="flex-auto">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable(height);
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Piecemarks;
