import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { confirmDialog } from 'primereact/confirmdialog';

import { debounce, noNullValues, onCopy } from 'utils';

import InfoBlock from './InfoBlock';
import { GlobalContext } from 'pages/Application';
import { Checkbox } from 'primereact/checkbox';
import useWindowControl from 'hooks/useWindowControl';
import useGetPermissions from 'hooks/useGetPermissions';

import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import { carrierGetCollection } from 'api';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  CarrierName: '',
  CarrierNumber: '',
  CellPhone: '',
  City: '',
  ContactName: '',
  Email: '',
  Fax: '',
  IsActive: true,
  Line1: '',
  Line2: '',
  OtherPhone2: '',
  OtherPhone3: '',
  OtherPhone4: '',
  State: '',
  WorkPhone: '',
  ZipCode: '',
};

export const ContextEditEditCarrierInformation = createContext({});

const EditCarrierInformation = () => {
  const { activeActions, sendPost, setHaveChanges, haveChanges } = useWindowControl(
    ROUTER_PATH.editCarrierInformation,
  );
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [withInactive, setWithInactive] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [data, setData] = useState([]);
  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.editCarrierInformation);

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

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const init = async (data, inactive = false) => {
    setLoading(true);
    try {
      const { Entries } = await carrierGetCollection({
        with_inactive: inactive,
      });
      setData(Entries.sort((a, b) => (a.CarrierName < b.CarrierName ? -1 : 1)));
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
            field="CarrierNumber"
            sortable
            header={t('table.carrier.carrier_number')}
            headerTooltip={t('table.carrier.carrier_number')}
            headerTooltipOptions={{ position: 'top' }}
          ></Column>
          <Column
            field="CarrierName"
            sortable
            header={t('table.carrier.carrier_name')}
            headerTooltip={t('table.carrier.carrier_name')}
            headerTooltipOptions={{ position: 'top' }}
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
                <div className="mb-2 flex align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !activeActions || !Create}
                      label={t('sts.btn.add.new.carrier')}
                      size="small"
                      onClick={() => {
                        prevSelected.current = selected;
                        setSelected(EMPTY);
                        setIsNew(true);
                      }}
                    />
                  </div>
                  <div className="flex align-items-center">
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
                    <label htmlFor="inactive" className="ml-2">
                      {t('sts.label.carrier.inActiveCarriers')}
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
              <ContextEditEditCarrierInformation.Provider
                value={{
                  accounts: data,
                  matchSelect,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
                  activeActions,
                  withInactive,
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
              </ContextEditEditCarrierInformation.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditCarrierInformation;
