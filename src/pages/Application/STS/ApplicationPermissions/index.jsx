import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { GlobalContext } from 'pages/Application';
import { permissionGet } from 'api/api.permission';
import { debounce, noNullValues } from 'utils';

import InfoBlock from './InfoBlock';
import GoToRootWindow from '../../components/GoToRootWindow';
import { compareEntries } from './object.util';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';
export const ContextEditPermission = createContext({});

const ApplicationPermissions = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [emptyPermissions, setEmptyPermissions] = useState(null);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.applicationPermission);

  const EMPTY = {
    ...emptyPermissions,
    Name: '',
    Desc: '',
    View: null,
    Edit: null,
    AllowAll: null,
    Delete: null,
    Create: null,
    ID: null,
  };

  useEffect(() => {
    init();
  }, []);

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const init = async (data = false) => {
    setLoading(true);
    try {
      const { Entries } = await permissionGet();
      setData(Entries.sort(compareEntries));
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

  const customSort = (event) => {
    let newData = [...data];
    newData.sort((entry1, entry2) => {
      const startsWithDot1 = entry1.Name.startsWith('.');
      const startsWithDot2 = entry2.Name.startsWith('.');

      if ((startsWithDot1 && startsWithDot2) || (!startsWithDot1 && !startsWithDot2)) {
        return event.order === 1
          ? entry1.Name.localeCompare(entry2.Name)
          : entry2.Name.localeCompare(entry1.Name);
      }

      return startsWithDot1 ? -1 : 1;
    });

    return newData;
  };
  const customSortDesc = (event) => {
    let newData = [...data];
    newData.sort((entry1, entry2) => {
      const startsWithDot1 = entry1.Name.startsWith('.');
      const startsWithDot2 = entry2.Name.startsWith('.');

      if (startsWithDot1 && !startsWithDot2) return -1;
      if (!startsWithDot1 && startsWithDot2) return 1;

      return event.order === 1
        ? entry1.Desc.localeCompare(entry2.Desc)
        : entry2.Desc.localeCompare(entry1.Desc);
    });

    return newData;
  };
  const matchSelect = (value) => {
    setSelected(value);
    scrollToSelectedIndex(data.indexOf(value));
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  const RenderTable = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          ref={tableRef}
          removableSort
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
          style={{ fontSize: 12 }}
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
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('sts.label.group.name')}
            headerTooltipOptions={{ position: 'top' }}
            field="Name"
            sortable
            sortFunction={customSort}
            header={t('sts.label.group.name')}
          ></Column>
          <Column
            headerTooltip={t('sts.reports.description')}
            headerTooltipOptions={{ position: 'top' }}
            field="Desc"
            sortFunction={customSortDesc}
            sortable
            header={t('sts.reports.description')}
          ></Column>
        </DataTable>
      );
    },
    [selected, loading, isNew, isEdit, data],
  );

  return (
    <div id="edit-employee-information" className="fadein grid grid-nogutter h-full">
      <AutoSizer className="h-full w-full">
        {({ height }) => (
          <Splitter layout="vertical" style={{ height: `${height}px` }}>
            <SplitterPanel size={20} className="p-2">
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex flex-wrap justify-content-end align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !Create}
                      label={t('sts.btn.add.new.group')}
                      size="small"
                      onClick={() => {
                        prevSelected.current = selected;
                        setSelected(EMPTY);
                        setIsNew(true);
                      }}
                    />
                  </div>
                  <div className="flex align-items-center flex-shrink-0 mt-2">
                    <div className="flex justify-content-between align-items-center">
                      <GoToRootWindow />
                    </div>
                  </div>
                </div>
                <div className="flex-auto">
                  <AutoSizer disableWidth className="flex-auto w-full">
                    {({ height }) => {
                      height !== initialTableHeight && dbHeight(height);
                      return height !== initialTableHeight ? null : RenderTable(height);
                    }}
                  </AutoSizer>
                </div>
              </div>
            </SplitterPanel>
            <SplitterPanel className="p-2">
              <ContextEditPermission.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  isNew,
                  isEdit,
                  setIsNew,
                  setIsEdit,
                  setEmptyPermissions,
                  Delete,
                  Edit,
                  Create,
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
                    init(value);
                    setIsNew(false);
                    setIsEdit(false);
                  }}
                  updated={(value) => {
                    init(value);
                  }}
                  copied={(value) => {
                    setData([...data, value]);
                    prevSelected.current = selected;
                    setSelected(value);
                  }}
                  deleted={() => {
                    init(prevSelected.current);
                  }}
                />
              </ContextEditPermission.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default ApplicationPermissions;
