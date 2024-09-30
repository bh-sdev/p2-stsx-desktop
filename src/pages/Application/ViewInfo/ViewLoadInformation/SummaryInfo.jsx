import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import { debounce, onCopy } from 'utils';
import { loadStatusSummary } from 'api/api.loads';

import { GlobalContext } from 'pages/Application';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const SummaryInfo = ({ criteria, loadedInfo }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);
  const [loading, setLoading] = useState(0);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [summary, setSummary] = useState({});

  const tableRef = useRef();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const res = await loadStatusSummary(loadedInfo.ID, {
        MarkNoDataCols: criteria.HideEmptyColumns,
      });
      setSummary(res);
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
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({
    tableRef,
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
          value={summary.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          style={{ fontSize: 12 }}
          selectionMode="single"
          dataKey="IdfileID"
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.status_description.status_sequence')}
            headerTooltipOptions={{ position: 'top' }}
            field="StatusSequence"
            sortable
            header={t('table.status_description.status_sequence')}
          ></Column>
          <Column
            headerTooltip={t('table.status_description.status_code')}
            headerTooltipOptions={{ position: 'top' }}
            field="StatusCode"
            sortable
            header={t('table.status_description.status_code')}
          ></Column>
          <Column
            headerTooltip={t('sts.txt.quantity')}
            headerTooltipOptions={{ position: 'top' }}
            field="Quantity"
            sortable
            header={t('sts.txt.quantity')}
          ></Column>
          <Column
            headerTooltip={t('table.general.percentage')}
            headerTooltipOptions={{ position: 'top' }}
            field="WeightPerc"
            sortable
            header={t('table.general.percentage')}
          ></Column>
          <Column
            headerTooltip={t('table.general.weight')}
            headerTooltipOptions={{ position: 'top' }}
            field="Weight"
            sortable
            header={t('table.general.weight')}
          ></Column>
          <Column
            headerTooltip={t('table.general.division')}
            headerTooltipOptions={{ position: 'top' }}
            field="Division"
            sortable
            header={t('table.general.division')}
          ></Column>
        </DataTable>
      );
    },
    [summary, loading, sortMeta],
  );

  return (
    <div className="flex flex-column table h-full">
      <div className="flex-auto">
        <AutoSizer disableWidth className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-3">
        <Button label={t('sts.btn.refresh')} onClick={init} />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default SummaryInfo;
