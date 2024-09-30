import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import InfoBlock from './InfoBlock';
import { userGetCollection } from 'api';
import { debounce, noNullValues, onCopy } from 'utils';
import { GlobalContext } from 'pages/Application';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  Description: '',
  AssociationID: '',
  EmployeeName: '',
  EmployeeID: '',
  IsActive: false,
  IsAdminAccount: false,
  IsReportWriterAdmin: false,
  Name: '',
  Password: '',
  ConfirmPassword: '',
  UseDualEntry: false,
  PermissionGroupID: '',
  MobileComputerIDs: [],
};

export const ContextLogonAccessManagement = createContext({});

const LogonAccessManagement = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [withInactive, setWithInactive] = useState(false);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);
  const { Edit, Delete, Create } = useGetPermissions(ScreenId.logonAccessManagement);

  useEffect(() => {
    init();
  }, []);

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const init = async (data, inactive = false) => {
    setLoading(true);
    try {
      const { Entries } = await userGetCollection(
        !inactive
          ? {}
          : {
              with_inactive: inactive,
            },
      );
      setData(Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)));
      const ind = data ? Entries.indexOf(Entries.find(({ ID }) => ID === data.ID)) : 0;
      const cur = Entries[ind];
      setSelected(cur);
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
          ref={tableRef}
          removableSort
          onCopy={onCopy}
          loading={loading}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={data}
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
          onColReorder={() => {}}
          rowClassName={({ ID, IsActive }) =>
            ID === selected?.ID || IsActive ? '' : 'surface-200 text-500'
          }
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.users.user_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="Name"
            sortable
            header={t('table.users.user_name')}
          ></Column>
          <Column
            headerTooltip={t('table.associations.association_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="AssociationName"
            sortable
            header={t('table.associations.association_name')}
          ></Column>
        </DataTable>
      );
    },
    [selected, loading, isNew, isEdit, sortMeta],
  );

  return (
    <div id="edit-employee-information" className="fadein grid grid-nogutter h-full">
      <AutoSizer className="h-full w-full">
        {({ height }) => (
          <Splitter style={{ height: `${height}px` }}>
            <SplitterPanel className="p-2" size={10}>
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex flex-wrap align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !Create}
                      label={t('sts.btn.logon.new')}
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
                      disabled={isEdit || isNew}
                      inputId="inactive"
                      name="pizza"
                      onChange={(e) => {
                        setWithInactive(e.checked);
                        init(!e.checked ? lastActiveSelected.current : selected, e.checked);
                      }}
                      checked={withInactive}
                    />
                    <label htmlFor="inactive" className="ml-2 ellipse">
                      {t('sts.label.inActiveLogin')}
                    </label>
                  </div>
                </div>
                <div className="flex-auto">
                  <AutoSizer className="flex-auto w-full">
                    {({ height }) => {
                      height !== initialTableHeight && dbHeight(height);
                      return height !== initialTableHeight ? null : RenderTable(height);
                    }}
                  </AutoSizer>
                </div>
              </div>
            </SplitterPanel>
            <SplitterPanel className="p-2">
              <ContextLogonAccessManagement.Provider
                value={{
                  accounts: data,
                  withInactive,
                  matchSelect,
                  isNew,
                  isEdit,
                  setIsNew,
                  setIsEdit,
                  Edit,
                  Delete,
                }}
              >
                <InfoBlock
                  current={noNullValues(selected || {})}
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
              </ContextLogonAccessManagement.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default LogonAccessManagement;
