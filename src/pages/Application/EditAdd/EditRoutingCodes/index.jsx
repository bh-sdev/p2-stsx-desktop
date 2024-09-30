import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { debounce, noNullValues, onCopy } from 'utils';

import { GlobalContext } from 'pages/Application';
import { routingCodesGetCollection } from 'api';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';

import InfoBlock from './InfoBlock';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  AllowAdditionalStatusCodes: false,
  Code: '',
  Desc: '',
  StatusCodes: [],
};

export const ContextEditEditRoutingCodes = createContext({});

const EditRoutingCodes = () => {
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
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editRoutingCodes);

  useEffect(() => {
    init();
  }, []);

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const init = async (data) => {
    setLoading(true);
    try {
      const { Entries } = await routingCodesGetCollection();
      setData(Entries.sort((a, b) => (a.Code < b.Code ? -1 : 1)));
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
      return (
        <DataTable
          loading={loading}
          removableSort
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
            header={t('table.routings.route_code')}
            bodyStyle={{ maxWidth: 100 }}
            headerTooltip={t('table.routings.route_code')}
            headerTooltipOptions={{ position: 'top' }}
          ></Column>
        </DataTable>
      );
    },
    [selected, loading, isNew, isEdit, sortMeta],
  );

  return (
    <div id="edit-routing-codes" className="fadein grid grid-nogutter h-full">
      <AutoSizer className="h-full w-full">
        {({ height }) => (
          <Splitter style={{ height: `${height}px` }}>
            <SplitterPanel className="p-2">
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !Create}
                      label={t('sts.btn.route.add')}
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
            <SplitterPanel className="p-2" size={150}>
              <ContextEditEditRoutingCodes.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
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
                  }}
                  updated={(value) => {
                    init(value);
                  }}
                  deleted={() => {
                    init(prevSelected.current);
                  }}
                />
              </ContextEditEditRoutingCodes.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditRoutingCodes;
