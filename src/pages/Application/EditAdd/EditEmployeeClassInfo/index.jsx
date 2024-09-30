import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { confirmDialog } from 'primereact/confirmdialog';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { debounce, noNullValues, onCopy } from 'utils';

import { GlobalContext } from 'pages/Application';
import useWindowControl from 'hooks/useWindowControl';
import useGetPermissions from 'hooks/useGetPermissions';
import { getEmployeeClasses } from 'api';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';

import InfoBlock from './InfoBlock';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  Code: '',
  Description: '',
  Order: null,
  UOM: '',
  Value: null,
};

export const ContextEmployeeClassInfo = createContext({});

const EditEmployeeClassInfo = () => {
  const { activeActions, sendPost, setHaveChanges, haveChanges } = useWindowControl(
    ROUTER_PATH.editEmployeeClassInfo,
  );
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [data, setData] = useState([]);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editEmployeeClassInfo);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    sendPost({ status: isNew || isEdit });
  }, [isNew, isEdit]);

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

  const init = async (data = false) => {
    setLoading(true);
    try {
      const { Entries } = await getEmployeeClasses();
      setData(Entries.sort((a, b) => (a.Description < b.Description ? -1 : 1)));
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
      return (
        <DataTable
          loading={loading}
          onCopy={onCopy}
          removableSort
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
          dataKey="ID"
          selection={selected}
          onRowClick={(e) => {
            if (!isNew && !isEdit) selectedIndex.current = e.index;
          }}
          onSelectionChange={(e) => {
            if (!isNew && !isEdit) {
              if (e.value.IsActiveFlag) {
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
            field="Code"
            sortable
            headerTooltipOptions={{ position: 'top' }}
            headerTooltip={t('sts.label.class.code')}
            header={t('sts.label.class.code')}
          ></Column>
          <Column
            field="Description"
            sortable
            headerTooltipOptions={{ position: 'top' }}
            headerTooltip={t('sts.label.description')}
            header={t('sts.label.description')}
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
            <SplitterPanel className="p-2" size={20}>
              <div className="flex flex-column table h-full">
                <div className="mb-2 w-2">
                  <div className="mr-4 w-2">
                    <Button
                      disabled={isEdit || isNew || !activeActions || !Create}
                      label={t('sts.btn.add.class')}
                      size="small"
                      onClick={() => {
                        prevSelected.current = selected;
                        setSelected(EMPTY);
                        setIsNew(true);
                      }}
                    />
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
              <ContextEmployeeClassInfo.Provider
                value={{
                  classInfo: data,
                  matchSelect,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
                  activeActions,
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
                    init(value);
                    setIsNew(false);
                    sendPost({ changed: true });
                  }}
                  updated={(value) => {
                    if (value.IsActiveFlag) lastActiveSelected.current = value;
                    init(value);
                    sendPost({ changed: true });
                  }}
                  deleted={() => {
                    init(prevSelected.current);
                    sendPost({ changed: true });
                  }}
                />
              </ContextEmployeeClassInfo.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditEmployeeClassInfo;
