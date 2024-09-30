import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTranslation } from 'react-i18next';
import moment from 'moment/moment';

import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';

import { FORMS_CONFIG } from 'configs';
import { debounce, formatCol, noEmptyStringValues, onCopy, trimStartEnd } from 'utils';
import {
  generateTable,
  getJobNumber,
  getLoadNumber,
  getStatusCodes,
  getInterimLoad,
  getTable,
  loadCreate,
  getLoads,
  loadStatistic,
  createShipping,
} from 'api/api.ship.num';
import { DEFAULT_CELL_WIDTH, DEFAULT_LIMIT_LOAD_PARAMS, DEFAULT_ROW_HEIGHT } from 'const';
import ROUTER_PATH from 'const/router.path';
import useSelectByCheckbox from 'hooks/useSelectByCheckbox';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import useTableSettings from 'hooks/useTableSettings';
import { FORM_LOGON_ACCESS } from 'configs/forms.config';
import GoToRootWindow from '../../components/GoToRootWindow';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import TableSettingsBtn from '../../components/TableSettingsBtn';
import { GlobalContext } from '../../index';
import ServiceUserStorage from '../../../../services/ServiceUserStorage';

const ShipIdNumbers = () => {
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const [loadNumbersSuggestions, setLoadNumberSuggestions] = useState([]);
  const loadNumberRefs = useRef();
  const [initialTableTopHeight, setInitialTableTopHeight] = useState(0);
  const [statusCodes, setStatusCodes] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [measureWeight, setMeasureWeight] = useState('lbs');
  const [shipMeasureWeight, setShipMeasureWeight] = useState('lbs');
  const [tableView, setTableView] = useState(false);
  const [allowInterimLoad, setInterimLoad] = useState(false);
  const [tableInfo, setTableInfo] = useState();
  const [dataTop, setDataTop] = useState({});
  const { refToast } = useContext(GlobalContext);

  const { t } = useTranslation();
  const { control, setError, watch, reset, getValues, setValue } = useForm({
    mode: 'onChange',
  });

  const { checkBoxSelectedOrigin, checkBoxSelected, setCheckBoxSelected, checkBoxSelect } =
    useSelectByCheckbox(dataTop.Entries, 'PK');

  const refLocalSelectedJob = useRef({});
  const selectedJobRef = useRef({});

  const tableRef = useRef();
  const tableId = useRef();
  const intervalReportID = useRef(null);

  const lastTop = useRef(false);
  const {
    onRowClick,
    handleCellClick,
    selected,
    setSelected,
    selectedCell,
    setFirstSelected,
    setLastSelected,
    setSelectedCell,
  } = useTableNavigation({
    data: dataTop,
    tableRef,
    IDField: 'PK',
  });

  useEffect(() => {
    refLocalSelectedJob.current = selectedJobRef.current;
    getStatusIds();
    getAllowInterimLoad();
  }, []);
  const setJob = (data) => {
    refLocalSelectedJob.current = data;
    selectedJobRef.current = data;
  };
  const refreshExpiration = async (request, interval) => {
    try {
      const res = await request(tableId.current, { Limit: 0, Offset: 0 });
      clearInterval(interval);
      interval = null;
      interval = setInterval(
        () => refreshExpiration(request, interval),
        !res.ExpireOn ? 240000 : moment(res.ExpireOn).diff(new Date(), 'milliseconds') - 60 * 1000,
      );
    } catch (e) {
      clearInterval(interval);
      interval = null;
    }
  };

  useEffect(() => {
    if (tableInfo) {
      refreshExpiration(getTable, intervalReportID.current);
    }
    return () => {
      if (tableInfo) {
        clearInterval(intervalReportID.current);
      }
    };
  }, [tableInfo]);

  const getStatusIds = async () => {
    const res = await getStatusCodes();
    setStatusCodes(
      res?.Entries.map(({ Name }) => ({
        label: Name,
        value: Name,
      })),
    );
  };
  const statusIdValue = watch('StatusID');
  const shipLoad = watch('ShipLoad');
  const getAllowInterimLoad = async () => {
    const res = await getInterimLoad();
    setInterimLoad(res.Allow);
  };
  const clear = () => {
    reset({
      CurrentLoad: {
        label: '',
        value: '',
      },
      LoadWeight: '',
      JobNumber: '',
      PicesLoad: '',
      IDsPieces: '',
      StatusID: '',
      IDLocation: '',
      InterimLoad: false,
      ShipLoad: '',
      ShipWeight: '',
    });
    setJob({});
    selectedJobRef.current = {};
    setMeasureWeight('lbs');
    setShipMeasureWeight('lbs');
  };

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await getJobNumber({ prefix });
      setNumberSuggestions(Entries.map((data) => ({ label: data.Number, value: data })));
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const initTable = async (params = DEFAULT_LIMIT_LOAD_PARAMS, option, initial) => {
    setLoadingTop(true);
    lastTop.current = false;
    try {
      setTableView(true);
      if (initial) {
        const resTable = await generateTable({
          JobID: getValues().JobID,
          ...(getValues().CurrentLoad?.value && { LoadID: getValues().CurrentLoad.value }),
        });

        setMeasureWeight(resTable.WeightMeasure);
        setTableInfo(resTable);
        tableId.current = resTable.ID;
        setValue('LoadWeight', resTable.Weight.toFixed(3));
        setValue('PicesLoad', resTable.Piecemarks);
        setValue('IDsPieces', resTable.Barcodes);
      }

      const res = await getTable(tableId.current, {
        ...params,
      });
      setDataTop(res);
      const arr = res.Entries || [];
      if (selected?.length) {
        const foundSelected = arr?.filter(({ PK }) =>
          selected?.find((selected) => selected?.PK === PK),
        );
        if (foundSelected.length) {
          setSelected(foundSelected);
        }
      } else {
        setSelected([arr?.[0]]);
        setFirstSelected(arr?.[0]);
        setLastSelected(arr?.[0]);
      }

      if (option === 'selectAll') {
        setCheckBoxSelected(res.Entries.reduce((a, data) => ({ ...a, [data.PK]: data }), {}));
      }
      if (!params.ColIDs && !tableSettings?.Entries) await tableSettingsGet(res.TableID);
    } finally {
      setLoadingTop(false);
    }
  };

  const {
    emptyCols,
    tableSettings,
    tableSettingsGet,
    tableSettingsSave,
    setSizeByColID,
    setOrderByColID,
    tableSettingsParams,
    setTableSettingsParams,
  } = useTableSettings({ initTable, tableRef, notOrderFirst: true, initRequest: false });
  const dbHeight = debounce((val, setCb) => {
    setCb(val);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({
    tableRef,
  });

  const loadMoreTop = async (params) => {
    setLoadingTop(true);
    try {
      const res = await getTable(tableId.current, {
        ...tableSettingsParams,
        ...params,
      });
      if (res.Entries.length) {
        setDataTop((prev) => ({ ...prev, Entries: [...prev.Entries, ...res.Entries] }));
      } else {
        lastTop.current = true;
      }
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setLoadingTop(false);
    }
  };

  const jobNumberFieldFlow = (data) => {
    if (!data) {
      clear();
      return;
    }
    const MATCHED = numberSuggestions.find(({ label }) => label === (data.label || data));
    if (MATCHED) {
      setJob(MATCHED.value);
      reset({ JobID: MATCHED.value.ID, JobNumber: MATCHED.label });
      setValue('JobID', MATCHED.value.ID);
    } else {
      confirmDialog({
        closable: false,
        message: t('1217'),
        header: t('1217'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          setJob({});
          setValue('JobID', '');
          setValue('JobNumber', '');
          setError('JobNumber', {
            type: 'validate',
            message: '',
          });
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const createLoad = async (copied) => {
    try {
      const res = await loadCreate({
        CopyPrevious: copied,
        ...(getValues().InterimLoad && { Destination: 'destination' }),
        JobNumber: getValues().JobNumber,
        LoadNumber: getValues().ShipLoad,
      });
      if (res) {
        getStatistic();
      }
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const shipCreate = async () => {
    setInitialLoading(true);
    try {
      const res = await createShipping(
        noEmptyStringValues({
          IDs: checkBoxSelected.map(({ PK }) => PK),
          JobNumber: getValues().JobNumber,
          LoadNumber: getValues().ShipLoad,
          ...(getValues().IDLocation && { Location: getValues().IDLocation }),
          StatusCode: getValues().StatusID,
        }),
      );
      setCheckBoxSelected({});
      if (res) {
        if (Object.keys(res.Warnings).length) {
          confirmDialog({
            closable: false,
            message: () => {
              {
                return Object.entries(res.Warnings).map(([key, value]) => (
                  <span key={key}>
                    {key} {key && ':'} {value} <br />
                  </span>
                ));
              }
            },
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            accept() {
              if (res.Success.length) {
                setTimeout(() => {
                  confirmDialog({
                    closable: false,
                    message: t('sts.info.shipment.message'),
                    header: t('sts.info.shipment.title'),
                    acceptLabel: t('sts.btn.ok'),
                    rejectClassName: 'hidden',
                    icon: 'pi pi-info-circle text-green-500',
                  });
                }, 200);
              }
            },
            icon: 'pi pi-exclamation-triangle text-yellow-500',
          });
        } else {
          setTimeout(() => {
            confirmDialog({
              closable: false,
              message: t('sts.info.shipment.message'),
              header: t('sts.info.shipment.title'),
              acceptLabel: t('sts.btn.ok'),
              rejectClassName: 'hidden',
              icon: 'pi pi-info-circle text-green-500',
            });
          }, 200);
        }
        await initTable({ ...tableSettingsParams, Limit: dataTop.Entries.length }, null, true);
        await getStatistic();
      }
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const getStatistic = async () => {
    if (!getValues().ShipLoad) return;
    try {
      const statistics = await loadStatistic({
        job_number: getValues().JobNumber,
        load_number: getValues().ShipLoad,
        only_current: true,
      });
      setValue('ShipWeight', statistics.CurrentWeight.toFixed(3));
      setShipMeasureWeight(statistics.WeightDim);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const onGetLoad = async (e) => {
    try {
      const res = await getLoads({
        job_number: getValues().JobNumber,
        load_number: e.target.value,
      });
      if (res) {
        getStatistic();
      }
    } catch (e) {
      if (e.response.data.Message === '301') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.ship.ids.load.not.exist'),
          header: t('sts.txt.load'),
          acceptLabel: t('sts.btn.no'),
          acceptClassName: 'p-button-secondary',
          rejectLabel: t('sts.btn.yes'),
          rejectClassName: 'secondary',
          reject: () => {
            setTimeout(() => {
              confirmDialog({
                closable: false,
                message: t('sts.txt.ship.ids.load.copy'),
                header: t('sts.txt.load'),
                acceptLabel: t('sts.btn.no'),
                acceptClassName: 'p-button-secondary',
                rejectLabel: t('sts.btn.yes'),
                rejectClassName: 'secondary',
                accept: () => {
                  createLoad(false);
                },
                reject: () => {
                  createLoad(true);
                },
              });
            }, 300);
          },
        });
      } else {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    }
  };

  const onScrollIndexChangeTop = ({ last }) => {
    if (last === dataTop.Entries.length && !loadingTop && !lastTop.current) {
      loadMoreTop({ Limit: 50, Offset: last });
    }
  };

  const sortTable = (e) => {
    const sortParams = {
      ...tableSettingsParams,
      Sort: sortTableParams(e),
      Offset: 0,
    };
    setTableSettingsParams((prevParams) => ({ ...prevParams, ...sortParams }));
    setSelectedCell((prevState) => ({ ...prevState, rowIndex: 0 }));
    initTable({ ...sortParams, Limit: dataTop.Entries.length }, false);
    lastTop.current = false;
  };

  const RenderTableTop = useCallback(
    (height) => {
      return !height || !tableView ? null : (
        <DataTable
          id="select-print"
          ref={tableRef}
          onCopy={onCopy}
          removableSort
          loading={loadingTop}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            onScrollIndexChange: onScrollIndexChangeTop,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={dataTop.Entries || []}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selection={checkBoxSelected}
          selectable
          selectionMode="checkbox"
          cellSelection
          onRowClick={onRowClick}
          onCellClick={(e) => {
            handleCellClick(e.rowData, e.field);
            onRowClick(e);
          }}
          rowClassName={(data) => {
            const isSelected = data && selected?.some((item) => item && item.PK === data.PK);

            if (isSelected) {
              return 'bg-gray-500';
            }
          }}
          dataKey="PK"
          onSort={sortTable}
          sortIcon={iconStatus}
          onColReorder={setOrderByColID}
          onColumnResizeEnd={setSizeByColID}
        >
          <Column
            key={'not_ordered'}
            columnKey={'not_ordered'}
            header={t('table.general.selection')}
            headerStyle={{ width: '10rem' }}
            reorderable={false}
            body={(rowData, { rowIndex }) => {
              return (
                <Checkbox
                  onChange={(e) => checkBoxSelect(e, rowData, rowIndex)}
                  checked={!!checkBoxSelectedOrigin[rowData.PK]}
                />
              );
            }}
          ></Column>
          {dataTop.Cols?.map((col) => {
            const colSize = tableSettings?.Entries?.find(({ ID }) => ID === col.ID)?.Size || null;
            return col.NoData ? null : (
              <Column
                key={col.ID}
                columnKey={col.ID}
                headerTooltip={col.Name}
                headerTooltipOptions={{ position: 'top' }}
                field={col.ID}
                sortable
                bodyClassName={(_, { rowIndex }) =>
                  +selectedCell.rowIndex === +rowIndex && String(selectedCell.field) === col.ID
                    ? 'selected-cell'
                    : ''
                }
                body={(rowData, { rowIndex }) => {
                  const uniqueId = `cell-${rowIndex}-${col.Alias}`;
                  return (
                    <div
                      id={uniqueId}
                      tabIndex={0}
                      style={{ width: colSize || DEFAULT_CELL_WIDTH }}
                    >
                      {formatCol(rowData, col)}
                    </div>
                  );
                }}
                header={col.Name}
                headerStyle={{ maxWidth: colSize || DEFAULT_CELL_WIDTH }}
              ></Column>
            );
          })}
        </DataTable>
      );
    },
    [
      dataTop,
      loadingTop,
      selected,
      sortMeta,
      tableView,
      tableSettings,
      checkBoxSelected,
      selectedCell,
    ],
  );

  const matchLoadNumbers = async (prefix) => {
    try {
      const { Entries } = await getLoadNumber({
        job_id: selectedJobRef.current.ID,
        prefix,
      });
      setLoadNumberSuggestions(Entries.map((data) => ({ label: data.Name, value: data.ID })));
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const getSelectedCounts = useMemo(() => {
    return checkBoxSelected.reduce(
      (a, { Quantity, Weight, WeightLbs }) => ({
        Quantity: a.Quantity + Quantity,
        Weight: a.Weight + Weight,
        WeightLbs: a.WeightLbs + WeightLbs,
      }),
      {
        Quantity: 0,
        Weight: 0,
        WeightLbs: 0,
      },
    );
  }, [checkBoxSelected]);

  return (
    <div className="flex flex-column h-full px-2 pt-2">
      <div
        style={{ zIndex: 10000 }}
        className="flex justify-content-end align-items-center mr-2 mb-2"
      >
        <GoToRootWindow />
      </div>
      <div className="h-full flex flex-column fadein">
        <Dialog visible={initialLoading} style={{ minWidth: 400, height: 100 }} closable={false}>
          {t('sts.txt.collecting.info')}...
        </Dialog>
        <div className="flex-auto flex flex-column disabled">
          <div className="flex flex-row">
            <div className="flex-auto">
              <div className="fadein grid grid-nogutter">
                <div style={{}} className="my-1">
                  <div className="">
                    <div className="flex align-items-center my-1">
                      <div className="w-9rem">{t('sts.label.job.number')}:</div>
                      <div className="">
                        <Controller
                          name="JobNumber"
                          control={control}
                          render={({ field, fieldState }) => {
                            return (
                              <AutoComplete
                                {...field}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`Number_${index}`} label={value.label} />
                                )}
                                dropdown
                                onSelect={(e) => {
                                  if (selectedJobRef.current.Number !== e.value.label) {
                                    jobNumberFieldFlow(e.value, field);
                                  }
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    if (selectedJobRef.current.Number !== e.target.value) {
                                      field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                      jobNumberFieldFlow(
                                        trimStartEnd(e.target.value.toUpperCase()),
                                        field,
                                      );
                                    }
                                  }, 400);
                                }}
                                onChange={(e) => {
                                  field.onChange((e.value?.label || e.value).toUpperCase());
                                }}
                                autoHighlight
                                style={{ width: '30rem' }}
                                completeMethod={(event) => matchNumber(event.query)}
                                suggestions={numberSuggestions}
                                className={classNames({
                                  required: true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Number}
                              />
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex align-items-center my-1" style={{ flex: 1 }}>
                      <div className="w-9rem">{t('sts.label.job.title')}:</div>
                      <InputText
                        disabled
                        readOnly
                        style={{ width: '30rem' }}
                        value={refLocalSelectedJob.current.Title || ''}
                      />
                    </div>

                    <div className="flex align-items-center my-1">
                      <div className="w-9rem">{t('sts.label.customer.number')}:</div>
                      <InputText
                        disabled
                        readOnly
                        style={{ width: '30rem' }}
                        value={refLocalSelectedJob.current.CustomerNumber || ''}
                      />
                    </div>
                    <div className="flex align-items-center" style={{ flex: 1 }}>
                      <div className="w-9rem">{t('sts.label.customer.name')}:</div>
                      <InputText
                        disabled
                        readOnly
                        style={{ width: '30rem' }}
                        value={refLocalSelectedJob.current.CustomerName || ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="flex align-items-center mb-1">
                  <div className="w-9rem">{t('sts.label.load.current')}:</div>
                  <Controller
                    name="CurrentLoad"
                    control={control}
                    render={({ field, fieldState }) => {
                      return (
                        <div style={{ width: '30rem' }}>
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip
                                id={`CurrentLoad_${index}`}
                                label={value.label}
                              />
                            )}
                            value={field.value?.Name || field.value}
                            dropdown
                            disabled={!selectedJobRef.current.Number}
                            onFocus={(e) => {
                              if (!loadNumberRefs.current) {
                                loadNumberRefs.current = e.target.value;
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.code === 'Enter') {
                                const MATCH = loadNumbersSuggestions.find(
                                  (el) => el.label === e.target.value,
                                );
                                if (MATCH) {
                                  field.onChange(MATCH);
                                  setCheckBoxSelected({});
                                  initTable({ ...tableSettingsParams, Limit: 50 }, null, true);
                                }
                              }
                              if (e.code === 'Tab') {
                                setTimeout(() => {
                                  if (e.target.value !== '') {
                                    setCheckBoxSelected({});
                                    initTable({ ...tableSettingsParams, Limit: 50 }, null, true);
                                  }
                                }, 150);
                              }
                            }}
                            onChange={(e) => {
                              field.onChange(e.value?.label || e.value);
                            }}
                            onSelect={(e) => {
                              field.onChange(e.value);
                              loadNumberRefs.current = null;
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                if (e.target.value !== '') {
                                  const MATCH = loadNumbersSuggestions.find(
                                    (el) => el.label === e.target.value,
                                  );
                                  if (MATCH) {
                                    field.onChange(MATCH);
                                  } else {
                                    field.onChange(loadNumberRefs.current);
                                    loadNumberRefs.current = null;
                                  }
                                }
                              }, 100);
                            }}
                            field="label"
                            completeMethod={(e) => matchLoadNumbers(e.query)}
                            suggestions={loadNumbersSuggestions}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORM_LOGON_ACCESS.fieldLength.LoginName}
                          />
                        </div>
                      );
                    }}
                  />
                </div>
                <h4 style={{ margin: 'auto' }} className="flex align-items-center font-bold">
                  ==== {t('sts.label.ship.out.number')} ====
                </h4>
              </div>
              <div className="flex align-items-center mb-1">
                <div className="w-9rem">{t('sts.label.load.wt')}:</div>
                <Controller
                  name="LoadWeight"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      style={{ width: 200 }}
                      id={field.name}
                      {...field}
                      disabled={true}
                      readOnly
                    />
                  )}
                />
                <div className="ml-2">{measureWeight}</div>
              </div>
              <div>
                <Button
                  className="mt-3"
                  disabled={!selectedJobRef.current.ID}
                  label={t('sts.edit.btn.ship.id.refresh')}
                  onClick={async () => {
                    setInitialLoading(true);
                    try {
                      setCheckBoxSelected({});
                      await initTable(DEFAULT_LIMIT_LOAD_PARAMS, false, true);
                    } finally {
                      setInitialLoading(false);
                    }
                  }}
                />
              </div>
              <div
                style={{ margin: '10px 0' }}
                className="flex align-items-center justify-content-between"
              >
                <div>
                  <h4>{t('sts.label.load.current.info')}</h4>
                </div>
                <div className="flex align-items-center w-30rem">
                  <h4 className="mr-2">{t('sts.label.pieces.load')}</h4>
                  <Controller
                    name="PicesLoad"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        style={{ width: 70 }}
                        id={field.name}
                        {...field}
                        disabled={true}
                        readOnly
                      />
                    )}
                  />
                  <div className="flex align-items-center">
                    <h4 className="ml-4 mr-2">{t('sts.label.id.pieces.load')}</h4>
                    <Controller
                      name="IDsPieces"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          style={{ width: 70 }}
                          id={field.name}
                          {...field}
                          disabled={true}
                          readOnly
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex align-items-center mb-1">
                <div className="w-8rem">{t('sts.label.association')}:</div>
                <InputText
                  disabled
                  readOnly
                  style={{ width: 150 }}
                  value={ServiceUserStorage.getUser().Association}
                />
              </div>
              <div className="flex align-items-center mb-1">
                <div className="w-8rem">{t('sts.label.id.status')}:</div>
                <Controller
                  name="StatusID"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Dropdown
                      id={field.name}
                      {...field}
                      options={statusCodes}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                    />
                  )}
                />
              </div>
              <div className="flex align-items-center mb-1">
                <div className="w-8rem">{t('sts.label.id.location')}:</div>
                <Controller
                  name="IDLocation"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      autoFocus
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                    />
                  )}
                />
              </div>
              <div className="flex align-items-center my-2">
                <div className="w-6rem">
                  <h4 style={{ margin: 0 }}>{t('table.loads.interim_load')}</h4>
                </div>
                <Controller
                  name="InterimLoad"
                  control={control}
                  render={({ field }) => {
                    return (
                      <>
                        <Checkbox
                          disabled={!allowInterimLoad}
                          {...field}
                          inputId="InterimLoad"
                          checked={field.value}
                        />
                      </>
                    );
                  }}
                />
              </div>
              <div className="flex align-items-center mb-1">
                <div className="w-8rem">{t('sts.label.load.shipped')}:</div>
                <Controller
                  name="ShipLoad"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      disabled={!refLocalSelectedJob.current.ID}
                      autoFocus
                      onKeyPress={(e) => {
                        if ((e.key === 'Enter' || e.key === 'Tab') && e.target.value) {
                          onGetLoad(e);
                          e.target.blur();
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          onGetLoad(e);
                        }
                      }}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                    />
                  )}
                />
              </div>
              <div className="flex align-items-center mb-1">
                <div className="w-7rem">{t('sts.label.load.wt')}:</div>
                <Controller
                  name="ShipWeight"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      autoFocus
                      disabled
                      readOnly
                      style={{ width: '76%' }}
                    />
                  )}
                />
                <div className="ml-2">{shipMeasureWeight}</div>
              </div>
            </div>
          </div>

          <div className="flex align-items-center mb-2">
            <h4 className="m-0 mr-4">
              {t('sts.label.selected.pieces')}: {getSelectedCounts.Quantity}
            </h4>
            <h4 className="m-0">
              {t('sts.label.selected.weight')}: {getSelectedCounts.Weight.toFixed(3)}{' '}
              {t('sts.txt.weight.metric')} / {getSelectedCounts.WeightLbs.toFixed(3)}{' '}
              {t('sts.txt.weight.imperial')}
            </h4>
          </div>

          <div className="h-full flex flex-column">
            <div className="flex-auto flex flex-column">
              <AutoSizer disableWidth className="flex-auto w-full">
                {({ height }) => {
                  height !== initialTableTopHeight && dbHeight(height, setInitialTableTopHeight);
                  return height !== initialTableTopHeight || emptyCols
                    ? null
                    : RenderTableTop(height);
                }}
              </AutoSizer>
            </div>
            <div className="flex justify-content-end gap-2 mt-3 p-2">
              <TableSettingsBtn
                disable={!tableView}
                tableID={dataTop.TableID}
                tableCurrentEntries={tableSettings?.Entries}
                save={tableSettingsSave}
                openFromRoutePath={ROUTER_PATH.shipIdNumbers}
              />

              <Button
                disabled={!dataTop.Entries?.length}
                label={t('sts.btn.highlighted')}
                size="small"
                onClick={() => {
                  setCheckBoxSelected((prevState) => ({
                    ...prevState,
                    ...selected.reduce((a, data) => ({ ...a, [data.PK]: data }), {}),
                  }));
                }}
              />
              <Button
                disabled={
                  !checkBoxSelected.length ||
                  !statusIdValue ||
                  !(getValues().CurrentLoad?.value || shipLoad)
                }
                label={t('sts.edit.btn.ship.id.ship.marked')}
                size="small"
                onClick={() => shipCreate()}
              />

              <Button
                disabled={!dataTop.Entries?.length}
                label={t('sts.btn.select.all')}
                size="small"
                onClick={() => {
                  initTable({ Limit: 10000 }, 'selectAll');
                }}
              />
              <Button
                label={t('sts.btn.clear.all')}
                size="small"
                onClick={() => {
                  setCheckBoxSelected({});
                  clear();
                }}
              />
              <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipIdNumbers;
