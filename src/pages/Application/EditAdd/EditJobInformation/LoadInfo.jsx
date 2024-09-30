import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment/moment';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableSettings from 'hooks/useTableSettings';
import { debounce, onCopy } from 'utils';
import { DEFAULT_CELL_WIDTH, DEFAULT_ROW_HEIGHT } from 'const';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';

const TABLE_ID = 'LoadWithIDAndExtra';

const LoadInfo = ({ loadInfo }) => {
  const { t } = useTranslation();
  const [initialTableHeight, setInitialTableHeight] = useState(0);

  const tableRef = useRef(null);

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });
  const { tableSettings, tableSettingsGet, tableSettingsSave, setSizeByColID, setOrderByColID } =
    useTableSettings({ tableRef, initRequest: false });

  const PREPARE_BODY_FOR_FIELD = {
    ShipDate: (string) => (string ? moment(string).format('L') : ''),
    SentEngineer: (string) => (string ? moment(string).format('L') : ''),
    SentFabrication: (string) => (string ? moment(string).format('L') : ''),
    SentFireproofer: (string) => (string ? moment(string).format('L') : ''),
    SentGalvinizer: (string) => (string ? moment(string).format('L') : ''),
    SentOther: (string) => (string ? moment(string).format('L') : ''),
    SentPainter: (string) => (string ? moment(string).format('L') : ''),
    SentSite: (string) => (string ? moment(string).format('L') : ''),
  };

  useEffect(() => {
    tableSettingsGet(TABLE_ID);
  }, []);

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const RenderTable = useMemo(() => {
    return !initialTableHeight ? null : (
      <DataTable
        ref={tableRef}
        loading={!loadInfo}
        removableSort
        onCopy={onCopy}
        scrollHeight={initialTableHeight}
        virtualScrollerOptions={{
          itemSize: DEFAULT_ROW_HEIGHT,
        }}
        scrollable
        value={loadInfo}
        totalRecords={loadInfo.length}
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        showGridlines
        size="small"
        selectionMode="single"
        dataKey="ID"
        onSort={sortTableParams}
        sortIcon={iconStatus}
        sortField={sortMeta?.sortField}
        sortOrder={sortMeta?.sortOrder}
        onColReorder={setOrderByColID}
        onColumnResizeEnd={setSizeByColID}
      >
        {tableSettings.Entries?.map((col) => {
          const colSize = col.Size || DEFAULT_CELL_WIDTH;
          const fieldID = tableSettings.Descs.find(({ ID }) => ID === col.ID).FieldID;

          return (
            <Column
              key={col.ID}
              columnKey={col.ID}
              headerTooltip={t(col.ID)}
              headerTooltipOptions={{ position: 'top' }}
              field={fieldID}
              sortable
              header={t(col.ID)}
              headerStyle={{ maxWidth: colSize }}
              body={(rowData) => (
                <div tabIndex={0} style={{ width: colSize }}>
                  {PREPARE_BODY_FOR_FIELD[fieldID]?.(rowData[fieldID]) || rowData[fieldID]}
                </div>
              )}
            />
          );
        })}
      </DataTable>
    );
  }, [loadInfo, tableSettings, iconStatus, sortMeta, initialTableHeight]);

  return (
    <div className="h-full flex flex-column justify-content-between">
      <div className="flex-auto">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable;
          }}
        </AutoSizer>
      </div>
      <div style={{ marginBottom: 7 }} className="flex mx-2 justify-content-end mt-2">
        <TableSettingsBtn
          tableID={TABLE_ID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={window.opener?.name}
        />
        <Button className="ml-2" label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default LoadInfo;
