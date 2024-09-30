import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { customerGetCollection } from 'api';
import { debounce, noNullValues } from 'utils';
import { GlobalContext } from 'pages/Application';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';

import InfoBlock from './InfoBlock';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  Applystax: false,
  BarcodeIncludePrefix: 'Include Prefix',
  BarcodeJobLength: 5,
  BarcodeJobStart: 'Last Characters of Job Number',
  BarcodePreambleLength: 5,
  BarcodePrefix: null,
  BarcodeStartingAtPosition: null,
  CorporationName: '',
  CustomerNumber: '',
  Email: '',
  Fax: '',
  Phone: '',
  Phone1: '',
  Phone2: '',
  Phone3: '',
  QuickbooksContactName: '',
  QuickbooksCoreReferenceNumber: null,
  QuickbooksStateTaxAccount: '',
  QuickbooksStateTaxAgent: '',
  Representative: '',
  Staxlocal: null,
  Staxmisc: null,
  Staxmta: null,
  Staxstate: null,
  Webpage: '',
};

export const ContextEditCustomerInformation = createContext({});

const EditCustomerInformation = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [data, setData] = useState([]);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editCustomerInformation);

  useEffect(() => {
    init();
  }, []);

  const init = async (data) => {
    setLoading(true);
    try {
      const { Entries } = await customerGetCollection();
      setData(Entries.sort((a, b) => (a.CorporationName < b.CorporationName ? -1 : 1)));
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
    isNew && setIsNew(false);
    setIsEdit(isNew || isEdit);
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
    scrollToSelectedIndex(selectedIndex.current);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  const RenderTable = useCallback(
    (height) => {
      return !height ? null : (
        <DataTable
          loading={loading}
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
            headerTooltip={t('sts.col.label.customer.number')}
            headerTooltipOptions={{ position: 'top' }}
            field="CustomerNumber"
            sortable
            header={t('sts.col.label.customer.number')}
          ></Column>
          <Column
            headerTooltip={t('table.customers.name')}
            headerTooltipOptions={{ position: 'top' }}
            field="CorporationName"
            sortable
            header={t('table.customers.name')}
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
            <SplitterPanel className="p-2">
              <div className="flex flex-column table h-full">
                <div className="grid grid-nogutter">
                  <div className="lg:col-6 sm:col-12 mb-2">
                    <Button
                      disabled={isEdit || isNew || !Create}
                      label={t('sts.btn.add.new.customer')}
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
              <ContextEditCustomerInformation.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
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
                    init(value);
                    setIsNew(false);
                  }}
                  updated={(value) => {
                    init(value);
                  }}
                  deleted={() => {
                    init(prevSelected.current);
                  }}
                />
              </ContextEditCustomerInformation.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditCustomerInformation;
