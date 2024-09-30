import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { debounce, noNullValues, onCopy } from 'utils';

import InfoBlock from './InfoBlock';
import { GlobalContext } from 'pages/Application';
import { Checkbox } from 'primereact/checkbox';
import useWindowControl from 'hooks/useWindowControl';
import ROUTER_PATH from 'const/router.path';
import { confirmDialog } from 'primereact/confirmdialog';
import { getLoads, jobsGet } from 'api/api.jobs';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { preferencesMiscInfoGet } from 'api';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  Number: '',
  Weight: '',
  CustomerID: '',
  Metric: '',
  ExternalJobNumber: '',
  Division: '',
  Status: '',
  ShipTo: '',
  Title: '',
  BillTo: '',
  Structure: '',
  ProjectYear: '',
  AssociationID: '',
  Location: '',
  Hours: null,
  CareOf: '',
  CustomerNameWithHash: '',
  BarcodeFormName: '',
  Efficiency: null,
  PO: '',
  Release: '',
  RFInterface: '<None>',
  DefaultBarcodeLabelFormat: '',
  BarcodeForm: '',
  DefaultLabelaseLabelFormat: '',
  KeepMinors: false,
  ValidateHeats: false,
  ValidatePipes: false,
  ValidateFittings: false,
};

export const ContextEditJobInformation = createContext({});

const EditJobInformation = ({
  setLoadInfo,
  isNew,
  isEdit,
  setIsNew,
  setIsEdit,
  setWithClosed,
  withClosed,
  Delete,
  Edit,
  Create,
}) => {
  const { activeActions, sendPost, setHaveChanges, haveChanges } = useWindowControl(
    ROUTER_PATH.editJobInfo,
  );
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [keepMinors, setKeepMinors] = useState(false);

  const tableRef = useRef();
  const prevSelected = useRef(null);
  const lastActiveSelected = useRef(null);

  useEffect(() => {
    init(undefined, withClosed);
    (async () => {
      try {
        const { KeepMinorPiecemarksUponImport } = await preferencesMiscInfoGet();
        setKeepMinors(KeepMinorPiecemarksUponImport);
      } catch (e) {
        refToast.current?.show({
          severity: 'error',
          summary: t('sts.txt.error'),
          detail: e.response.data.Message,
          life: 3000,
        });
      }
    })();
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

  const init = async (data, closed = false) => {
    setLoading(true);
    try {
      const { Entries } = await jobsGet({
        ...(closed ? { include_closed: true } : null),
      });
      setData(Entries.sort((a, b) => (a.Number < b.Number ? -1 : 1)));
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

  const getLoadInfo = async (id) => {
    const { Entries } = await getLoads({ job_id: id });
    setLoadInfo(Entries);
  };
  useEffect(() => {
    if (selected && selected.ID) {
      getLoadInfo(selected.ID);
    }
  }, [selected]);

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
              if (e.value.Status !== 'Closed') {
                lastActiveSelected.current = e.value;
              }
              prevSelected.current = selected;
              setSelected(e.value);
            }
          }}
          onColReorder={() => {}}
          rowClassName={({ ID, Status }) =>
            ID === selected?.ID || Status !== 'Closed' ? '' : 'surface-200 text-500'
          }
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltipOptions={{ position: 'top' }}
            headerTooltip={t('sts.label.job.number')}
            field="Number"
            sortable
            header={t('sts.label.job.number')}
          ></Column>
          <Column
            headerTooltipOptions={{ position: 'top' }}
            headerTooltip={t('table.customers.customer_number')}
            field="CustomerNumber"
            sortable
            header={t('table.customers.customer_number')}
          ></Column>
          <Column
            headerTooltipOptions={{ position: 'top' }}
            headerTooltip={t('table.customers.name')}
            field="CustomerName"
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
          <Splitter style={{ border: 'none', height: `${height}px` }}>
            <SplitterPanel className="p-2" size={20}>
              <div className="flex flex-column table h-full">
                <div className="mb-2 flex align-items-center">
                  <div className="mr-4">
                    <Button
                      disabled={isEdit || isNew || !activeActions || !Create}
                      label={t('sts.btn.addJob')}
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
                        setWithClosed(e.checked);
                        init(!e.checked ? lastActiveSelected.current : selected, e.checked);
                      }}
                      checked={withClosed}
                    />
                    <label htmlFor="inactive" className="ml-2">
                      {t('sts.label.job.isClosedJobs')}
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
              <ContextEditJobInformation.Provider
                value={{
                  jobs: data,
                  matchSelect,
                  keepMinors,
                  isNew,
                  setIsNew,
                  isEdit,
                  setIsEdit,
                  activeActions,
                  withClosed,
                  Delete,
                  Edit,
                }}
              >
                <InfoBlock
                  current={noNullValues(selected || {})}
                  withClosed={withClosed}
                  cancel={() => {
                    setIsNew(false);
                    setSelected(prevSelected.current);
                    scrollToSelectedIndex();
                  }}
                  created={(value) => {
                    init(
                      value.Status === 'Closed' && !withClosed ? prevSelected.current : value,
                      withClosed,
                    );
                    setIsNew(false);
                    sendPost({ changed: true });
                  }}
                  updated={(value) => {
                    init(
                      value.Status === 'Closed' && !withClosed ? prevSelected.current : value,
                      withClosed,
                    );
                    sendPost({ changed: true });
                  }}
                  deleted={() => {
                    init(prevSelected.current, withClosed);
                    sendPost({ changed: true });
                  }}
                />
              </ContextEditJobInformation.Provider>
            </SplitterPanel>
          </Splitter>
        )}
      </AutoSizer>
    </div>
  );
};

export default EditJobInformation;
