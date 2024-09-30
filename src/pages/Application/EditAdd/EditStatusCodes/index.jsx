import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Checkbox } from 'primereact/checkbox';

import { statusCodesGetCollection } from 'api';
import { debounce, noNullValues, onCopy } from 'utils';
import { GlobalContext } from 'pages/Application';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';

import InfoBlock from './InfoBlock';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  AssociationID: '',
  StatusCode: '',
  ProcessID: '',
  Description: '',
  Process: '',
  EndForStatusCode: '',
  EndForStatusID: '',
  ReqXferStatusCode: '',
  ReqXferStatusID: '',
  ReqBundleStatusCode: '',
  ReqBundleStatusID: '',
  AccountingCode: '',
  ThirdPartyStationName: '',
  EmployeeClassCodes: [],
  WorkerEmployeeNumberRequired: false,
  PercentageScan: false,
  AllowMultiScan: false,
  MtrPdfRequired: false,
  AllowStartIfPriorCodeNotComplete: false,
  PushTransactionToThirdParty: false,
  PromptComplete: false,
  IsActive: true,
};

export const ContextEditStatusCodes = createContext({});

const EditStatusCodes = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState({});
  const [withInactive, setWithInactive] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [clearStart, setClearStart] = useState(false);
  const lastActiveSelected = useRef(null);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editStatusCodes);

  useEffect(() => {
    init();
  }, []);

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const init = async (data, inactive = false) => {
    setLoading(true);
    try {
      const { Entries } = await statusCodesGetCollection({
        with_inactive: inactive,
      });
      setData(Entries.sort((a, b) => (a.StatusCode < b.StatusCode ? -1 : 1)));
      if (Entries.length) {
        const ind = data ? Entries.indexOf(Entries.find(({ ID }) => ID === data.ID)) : 0;
        const cur = Entries[ind];
        setSelected(cur);
      } else {
        setSelected(EMPTY);
        setClearStart(true);
        setIsNew(true);
      }
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

  const matchSelect = (value) => {
    setSelected(value);
    scrollToSelectedIndex(data.indexOf(value));
    isNew && setIsNew(false);
    setIsEdit(isNew || isEdit);
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
    setTimeout(scrollToSelectedIndex, 1000);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  const RenderTable = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          removableSort
          loading={loading}
          onCopy={onCopy}
          ref={tableRef}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={data}
          totalRecords={data.length}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selectionMode="single"
          selection={selected}
          dataKey="ID"
          onRowClick={(e) => {
            if (!isNew && !isEdit) selectedIndex.current = e.index;
          }}
          onSelectionChange={(e) => {
            if (!isNew && !isEdit) {
              if (e.value.IsActive) {
                lastActiveSelected.current = e.value;
              }
              prevSelected.current = selected;
              setSelected(e.value);
            }
          }}
          rowClassName={({ ID, IsActive }) =>
            ID === selected?.ID || IsActive ? '' : 'surface-200 text-500'
          }
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.general.process.id')}
            headerTooltipOptions={{ position: 'top' }}
            field="ProcessID"
            sortable
            header={t('table.general.process.id')}
          ></Column>
          <Column
            headerTooltip={t('table.associations.association_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="AssociationName"
            sortable
            header={t('table.associations.association_name')}
          ></Column>
          <Column
            headerTooltip={t('table.general.status_code')}
            headerTooltipOptions={{ position: 'top' }}
            field="StatusCode"
            sortable
            header={t('table.general.status_code')}
          ></Column>
        </DataTable>
      );
    },
    [selected, loading, isNew, isEdit, sortMeta],
  );

  return (
    <div id="edit-status-codes" className="fadein grid grid-nogutter h-full">
      <AutoSizer className="h-full w-full">
        {({ height }) => (
          <Splitter style={{ height: `${height}px` }}>
            <SplitterPanel className="p-2">
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex flex-wrap align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || clearStart || !Create}
                      label={t('sts.btn.add.code')}
                      size="small"
                      onClick={() => {
                        prevSelected.current = selected;
                        setSelected(EMPTY);
                        setIsNew(true);
                      }}
                    />
                  </div>
                  <div className="flex align-items-center flex-shrink-0 mt-2">
                    <Checkbox
                      disabled={isEdit || isNew || clearStart}
                      inputId="inactive"
                      name="pizza"
                      onChange={(e) => {
                        setWithInactive(e.checked);
                        init(!e.checked ? lastActiveSelected.current : selected, e.checked);
                      }}
                      checked={withInactive}
                    />
                    <label htmlFor="inactive" className="ml-2 ellipse">
                      {t('sts.label.status.inActiveStatus')}
                    </label>
                  </div>
                </div>
                <div className="flex-auto">
                  <AutoSizer className="flex-auto w-full">
                    {({ height }) => {
                      height > initialTableHeight && dbHeight(height);
                      return height > initialTableHeight ? null : RenderTable(height);
                    }}
                  </AutoSizer>
                </div>
              </div>
            </SplitterPanel>
            <SplitterPanel className="p-2">
              <ContextEditStatusCodes.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
                  withInactive,
                  clearStart,
                  Edit,
                  Delete,
                }}
              >
                <InfoBlock
                  current={noNullValues(selected)}
                  cancel={() => {
                    setIsNew(false);
                    setSelected(prevSelected.current);
                    scrollToSelectedIndex();
                  }}
                  created={(value) => {
                    init(
                      !value.IsActive && !withInactive ? prevSelected.current : value,
                      withInactive,
                    );
                    setIsNew(false);
                  }}
                  updated={(value) => {
                    if (value.IsActive) lastActiveSelected.current = value;
                    init(
                      !value.IsActive && !withInactive ? prevSelected.current : value,
                      withInactive,
                    );
                  }}
                  deleted={() => {
                    init(prevSelected.current, withInactive);
                  }}
                />
              </ContextEditStatusCodes.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditStatusCodes;
