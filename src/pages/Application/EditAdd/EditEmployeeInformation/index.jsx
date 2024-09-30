import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import InfoBlock from './InfoBlock';
import { employeeClassIds, employeeGetCollection } from 'api';
import { debounce, noNullValues, onCopy } from 'utils';
import { GlobalContext } from 'pages/Application';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useWindowControl from 'hooks/useWindowControl';
import useGetPermissions from 'hooks/useGetPermissions';
import { confirmDialog } from 'primereact/confirmdialog';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  ActivityLogging: false,
  CellPhone: '',
  ClassID: '',
  AssociationID: '',
  Email: '',
  FTEmployeeID: null,
  FirstName: '',
  IsActive: true,
  LastName: '',
  MiddleName: '',
  Number: '',
  OtherPhone1: '',
  OtherPhone2: '',
  OtherPhone3: '',
  LoginName: '',
  UserName: '',
  WorkPhone: '',
};

export const ContextEditEmployeeInformation = createContext({});

const EditEmployeeInformation = () => {
  const { activeActions, sendPost, setHaveChanges, haveChanges } = useWindowControl(
    ROUTER_PATH.editEmployeeInformation,
  );
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.employeeInfo);
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [classIds, setClassIds] = useState([]);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [data, setData] = useState([]);
  const [dynamicCols, setDynamicCols] = useState([]);
  const [selected, setSelected] = useState(null);
  const [withInactive, setWithInactive] = useState(false);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);

  useEffect(() => {
    sendPost({ status: isNew || isEdit });
  }, [isNew, isEdit]);

  useEffect(() => {
    loadClassIds();
  }, []);

  const loadClassIds = async () => {
    try {
      const { Entries } = await employeeClassIds();
      setClassIds(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (haveChanges) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.changed.data'),
        header: t('sts.txt.notice'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          init();
          setHaveChanges(false);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-yellow-500',
      });
    }
  }, [haveChanges]);

  const init = async (data, inactive = false) => {
    setLoading(true);
    try {
      const { Entries, DynamicCols } = await employeeGetCollection({
        with_inactive: inactive,
      });
      setDynamicCols(DynamicCols);
      setData(Entries.sort((a, b) => (a.LastName < b.LastName ? -1 : 1)));
      const ind = data
        ? Entries.indexOf(Entries.find(({ EmployeeID }) => EmployeeID === data.EmployeeID))
        : 0;
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

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const matchSelect = (value) => {
    setSelected(value);
    scrollToSelectedIndex(data.indexOf(value));
    if (activeActions) {
      isNew && setIsNew(false);
      setIsEdit(isNew || isEdit);
    }
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
          dataKey="EmployeeID"
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
          rowClassName={({ EmployeeID, IsActive }) =>
            EmployeeID === selected?.EmployeeID || IsActive ? '' : 'surface-200 text-500'
          }
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.employee.employee_firstname')}
            headerTooltipOptions={{ position: 'top' }}
            field="FirstName"
            sortable
            header={t('table.employee.employee_firstname')}
          ></Column>
          <Column
            headerTooltip={t('table.employee.employee_lastname')}
            headerTooltipOptions={{ position: 'top' }}
            field="LastName"
            sortable
            header={t('table.employee.employee_lastname')}
          ></Column>
          <Column
            headerTooltip={t('table.employee.employee_number')}
            headerTooltipOptions={{ position: 'top' }}
            field="Number"
            sortable
            header={t('table.employee.employee_number')}
          ></Column>
          <Column
            headerTooltip={t('table.employee.association.name')}
            headerTooltipOptions={{ position: 'top' }}
            field="Association"
            sortable
            header={t('table.employee.association.name')}
          ></Column>
          {dynamicCols.map((name, index) => (
            <Column
              headerTooltip={`${name} ${t('sts.txt.logon')}`}
              headerTooltipOptions={{ position: 'top' }}
              key={name}
              field={`DynamicCols.${index}`}
              sortable
              header={`${name} ${t('sts.txt.logon')}`}
              body={(data) =>
                !data.DynamicCols ? null : <Checkbox disabled checked={data.DynamicCols[index]} />
              }
            />
          ))}
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
            <SplitterPanel className="p-2">
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex flex-wrap align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !activeActions || !Create}
                      label={t('sts.btn.add.new.employee')}
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
                      disabled={isEdit || isNew || !activeActions}
                      inputId="inactive"
                      name="pizza"
                      onChange={(e) => {
                        setWithInactive(e.checked);
                        init(!e.checked ? lastActiveSelected.current : selected, e.checked);
                      }}
                      checked={withInactive}
                    />
                    <label htmlFor="inactive" className="ml-2 ellipse">
                      {t('sts.label.employee.inActiveEmployee')}
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
              <ContextEditEmployeeInformation.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  classIds,
                  isNew,
                  isEdit,
                  setIsNew,
                  setIsEdit,
                  activeActions,
                  withInactive,
                  Create,
                  Delete,
                  Edit,
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
                    sendPost({ changed: true });
                  }}
                  updated={(value) => {
                    if (value.IsActive) lastActiveSelected.current = value;
                    init(
                      !value.IsActive && !withInactive ? prevSelected.current : value,
                      withInactive,
                    );
                    sendPost({ changed: true });
                  }}
                  deleted={() => {
                    init(prevSelected.current, withInactive);
                    sendPost({ changed: true });
                  }}
                />
              </ContextEditEmployeeInformation.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditEmployeeInformation;
