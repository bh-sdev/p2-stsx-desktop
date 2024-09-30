import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { RadioButton } from 'primereact/radiobutton';

import { removeEmptyParams } from 'api/general';
import {
  kissImportUpdate,
  kissJobRecords,
  kissJobRecordsUpdateCash,
  kissPreferences,
  kissReportsLoads,
  kissRoutingCodes,
  kissSaveDiscardTypes,
  kissSavePreferences,
  kissShopOrders,
} from 'api/api.kiss';
import ENDPOINTS from 'const/endpoints';
import { ServiceTokenStorage } from 'services';
import { debounce, noNullValues, onCopy, trimAll } from 'utils';

import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { API_CONFIG } from 'configs';
import { useLocation } from 'react-router-dom';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import useActions from 'hooks/useActions';
import ROUTER_PATH from 'const/router.path';
import { DEFAULT_CELL_WIDTH, DEFAULT_ROW_HEIGHT } from 'const';
import TableSettingsBtn from 'pages/Application/components/TableSettingsBtn';
import useTableSettings from 'hooks/useTableSettings';

const TABLE_ID = 'ImportPart';

const TableValidationSchema = yup.object({
  Parts: yup.array().of(
    yup.object({
      LabelsNeeded: yup.number().required(),
    }),
  ),
});

const hideStatuses = ['C LABEL', 'C SEQUENCE', 'C LABEL SEQUENCE'];

const PREPARE_BODY_FOR_FIELD = {
  Weight: (value) => `${value?.toFixed(3)} (kg)`,
  WeightImperial: (value) => `${value?.toFixed(3)} (lb)`,
  AssemblyWeight: (value) => `${value?.toFixed(3)} (kgs)`,
  AssemblyWeightImperial: (value) => `${value?.toFixed(3)} (lb)`,
  ItemLengthMetric: (value) => `${value?.toFixed(3)} (mm)`,
  ItemLengthImperial: (value) => `${value?.toFixed(3)} (in)`,
};

const MultiSelectionUpdate = ({ disabled, success }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState('');

  const update = () => {
    success(selected);
    close();
  };

  const close = () => {
    setVisible(false);
    setSelected('');
  };

  const STATUS_OPTIONS = [
    { label: t('import.create'), value: 'CREATE' },
    { label: t('import.update'), value: 'UPDATE' },
    { label: t('import.summarize'), value: 'SUMMARIZE' },
    { label: t('import.ignore'), value: 'NO IMPORT' },
  ];

  return (
    <>
      <Button
        disabled={disabled}
        label={t('sts.btn.multi.select')}
        size="small"
        onClick={() => setVisible(true)}
      />
      <Dialog
        header={t('sts.txt.import.change.actions')}
        visible={visible}
        onHide={close}
        closable={false}
      >
        <div className="flex">
          <i className="pi pi-question-circle text-blue-400 mr-3" style={{ fontSize: '2rem' }}></i>
          <div className="w-full">
            <p className="m-0 mb-2">{t('sts.txt.import.change.actions.select')}</p>
            <div className="flex flex-wrap gap-3">
              {STATUS_OPTIONS.map(({ label, value }) => (
                <div key={value} className="flex align-items-center">
                  <RadioButton
                    inputId={value}
                    value={value}
                    onChange={(e) => setSelected(e.value)}
                    checked={selected === value}
                  />
                  <label htmlFor={value} className="ml-2 cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 my-4">
          <Button disabled={!selected} label={t('sts.btn.update')} size="small" onClick={update} />
          <Button label={t('sts.btn.cancel')} size="small" onClick={close} />
        </div>
      </Dialog>
    </>
  );
};

const registerForm = (defaultValues, resolver = null) => {
  const {
    control,
    handleSubmit,
    getValues,
    reset,
    resetField,
    setValue,
    formState: { dirtyFields, isDirty },
  } = useForm({
    defaultValues,
    resolver,
    mode: 'onChange',
  });

  return {
    control,
    handleSubmit,
    getValues,
    reset,
    resetField,
    setValue,
    dirtyFields,
    isDirty,
  };
};

const KissImportTable = ({ data }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { refToast } = useContext(GlobalContext);
  const { addHistoryLink } = useActions();
  const { Edit } = useGetPermissions(ScreenId.kissImport);
  const { t } = useTranslation();
  const formFilter = registerForm({
    ImportPreferences: {
      RouteCodeID: '',
      RouteCode: '',
      SaveRemarksInfo: '',
      Area: '',
      KeepMinors: false,
      NotesContainCamberInfo: false,
      ShopOrder: '',
      Prefs: {},
    },
    JobID: '',
    LastImport: true,
    DiscardTypes: [],
  });
  const formTable = registerForm({ Parts: [] }, yupResolver(TableValidationSchema));

  const [localData, setLocalData] = useState({});
  const [routeCodesSuggestions, setRouteCodesSuggestions] = useState([]);
  const [shopOrderSuggestions, setShopOrderSuggestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hideIgnored, setHideIgnored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [startImport, setStartImport] = useState(false);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [loadingReportsLoads, setLoadingReportsLoads] = useState(false);

  const SseID = useRef('');
  const refRouteCodeField = useRef(null);
  const refRouteCode = useRef(null);
  const refSelected = useRef([]);
  const refNoImported = useRef([]);
  const refWithSettings = useRef(Boolean(query.get('with_settings')));
  const tableRef = useRef();

  const {
    tableSettings,
    tableSettingsGet,
    tableSettingsSave,
    setSizeByColID,
    setOrderByColID,
    tableSettingsParams,
  } = useTableSettings({ tableRef, initRequest: false, paginated: true });

  const STATUS_OPTIONS = [
    { label: t('import.create'), value: 'CREATE' },
    { label: t('import.update'), value: 'UPDATE' },
    { label: t('import.summarize'), value: 'SUMMARIZE' },
    { label: t('import.ignore'), value: 'NO IMPORT' },
    { label: t('import.review.label'), value: 'C LABEL' },
    { label: t('import.review.sequence'), value: 'C SEQUENCE' },
    { label: t('import.review.label.sequence'), value: 'C LABEL SEQUENCE' },
  ];

  useEffect(() => {
    if (hideIgnored) {
      formTable.reset({
        Parts: formTable.getValues().Parts.filter((item) => {
          const res = item.Status !== 'NO IMPORT';
          if (!res) refNoImported.current.push(item);
          return res;
        }),
      });
      setSelected(selected.filter(({ Status }) => Status !== 'NO IMPORT'));
    } else {
      formTable.reset({
        Parts: [...refNoImported.current, ...formTable.getValues().Parts].sort((a, b) =>
          a.ImportQuantity > b.ImportQuantity ? -1 : 1,
        ),
      });
      refNoImported.current = [];
    }
  }, [hideIgnored]);

  useEffect(() => {
    if (data?.Job?.ID) {
      tableSettingsGet(TABLE_ID);
      setLocalData({ FileHeader: data.FileHeader, ImportPreferences: data.ImportPreferences });
      initPreferences();
    }
  }, [data]);

  const initPreferences = async () => {
    try {
      const ImportPreferences = await kissPreferences({ job_id: data.Job.ID });
      formFilter.reset(
        noNullValues({
          JobID: data.Job.ID,
          DiscardTypes: data.ImportPreferences.DiscardTypes?.sort((a, b) =>
            a.Shape < b.Shape ? -1 : 1,
          ),
          ImportPreferences: {
            ...ImportPreferences,
            KeepMinors: ImportPreferences.Prefs.KeepMinors,
          },
        }),
      );
      formTable.reset({
        Parts: data.Parts.sort((a, b) => (a.ImportQuantity > b.ImportQuantity ? -1 : 1)),
      });
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const updateViewInfo = async (data) => {
    try {
      setLoading(true);
      tableRef.current.reset();
      const { Parts, ...rest } = await kissJobRecords({
        job_id: data.JobID,
        with_settings: refWithSettings.current,
        keep_minors: data.ImportPreferences.KeepMinors,
      });
      formTable.reset({
        Parts: Parts.sort((a, b) => (a.ImportQuantity > b.ImportQuantity ? -1 : 1)),
      });
      setLocalData((prevState) => ({ ...prevState, ...rest }));
      if (!tableSettingsParams.ColIDs && !tableSettings?.Entries) await tableSettingsGet(TABLE_ID);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const matchShopOrder = async (prefix) => {
    try {
      const { Entries } = await kissShopOrders({ prefix, job_id: data.Job.ID });
      setShopOrderSuggestions(Entries.map((value) => ({ label: value, value })));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const matchRouteCode = async (prefix) => {
    try {
      const { Entries } = await kissRoutingCodes({ prefix });
      setRouteCodesSuggestions(Entries.map(({ ID, Number }) => ({ label: Number, value: ID })));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const requestImport = async (data) => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.question.continue.with.import'),
      header: t('sts.txt.question'),
      acceptLabel: t('sts.btn.no'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.yes'),
      rejectClassName: 'p-button-primary',
      reject: async () => {
        const DATA = {
          ...data,
          Parts: formTable
            .getValues()
            .Parts.filter(({ Status }) => Status !== 'NO IMPORT')
            .sort((a, b) => b.ParentPieceMark - a.ParentPieceMark),
        };
        setStartImport(true);
        const es = new EventSource(
          `${API_CONFIG.baseURL}${ENDPOINTS.sse.import}?token=${ServiceTokenStorage.getToken()}`,
        );
        es.onmessage = async (data) => {
          if (data.data[0] === '{' && !SseID.current) {
            const parsedData = JSON.parse(data.data);
            SseID.current = parsedData.sseid;
          } else {
            if (data.data === 'end') es.close();
            setImportProgress(data.data);
          }
        };
        es.onopen = () => {
          setTimeout(async () => {
            try {
              const res = await kissImportUpdate(
                removeEmptyParams({ ...DATA, SseID: SseID.current }),
              );
              confirmDialog({
                closable: false,
                message: t('1264'),
                header: 1264,
                acceptLabel: t('sts.btn.ok'),
                rejectClassName: 'hidden',
                accept: () => {
                  if (res.NeedToDeleteRecords) {
                    setTimeout(() => {
                      confirmDialog({
                        closable: false,
                        message: t('sts.txt.where.not.found.piecemarks'),
                        header: t('sts.txt.non.imported.piecemarks'),
                        acceptLabel: t('sts.btn.continue'),
                        rejectClassName: 'hidden',
                        accept: async () => {
                          try {
                            setLoadingReportsLoads(true);
                            const { ID } = await kissReportsLoads({
                              JobID: data.JobID,
                              ImportTime: res.ImportStartTime,
                            });
                            addHistoryLink({
                              title: t('sts.txt.job.piecemark.delete'),
                              path: `${window.origin}/${ROUTER_PATH.kissImportDeletion}/${ID}`,
                              multiple: false,
                            });
                            window.close();
                          } catch (e) {
                            refToast.current?.show({
                              severity: 'error',
                              summary: t('sts.txt.error'),
                              detail: e.response?.data.Message,
                              life: 3000,
                            });
                          } finally {
                            setLoadingReportsLoads(false);
                          }
                        },
                        reject: () => {
                          setImported(true);
                          window.close();
                        },
                        icon: 'pi pi-question-circle text-blue-400',
                      });
                    }, 100);
                    return;
                  }
                  setImported(true);
                  window.close();
                },
                icon: 'pi pi-info-circle text-green-500',
              });
            } catch (e) {
              confirmDialog({
                closable: false,
                message: t(e.response.data.Detail),
                header: t(e.response.data.Message),
                acceptLabel: t('sts.btn.ok'),
                rejectClassName: 'hidden',
                icon: 'pi pi-times-circle text-yellow-500',
              });
            } finally {
              setImportProgress(null);
              setStartImport(false);
              es.close();
              SseID.current = null;
            }
          }, 400);
        };
      },
      icon: 'pi pi-question-circle text-blue-400',
    });
  };

  const updateImport = async (values) => {
    if (formFilter.dirtyFields?.ImportPreferences?.KeepMinors) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.question.have.import.settings.been.applied'),
        header: t('sts.txt.question'),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'p-button-primary',
        accept: () => {
          setTimeout(() => {
            applySettings(values, applySettingsAccept, applySettingsReject);
          }, 100);
        },
        icon: 'pi pi-question-circle text-blue-400',
      });
      return;
    }

    applySettings(values, applySettingsAccept, applySettingsReject);
  };

  const checkEmptyRouteCodeInTable = (values) => {
    if (data.ImportPreferences.RoutesInFileFound) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.question.routing.used.import'),
        header: t('sts.txt.question'),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'p-button-primary',
        reject: () => {
          setTimeout(() => {
            requestImport({ ...values, RoutesFromKissFile: true });
          }, 100);
        },
        accept: () => {
          setTimeout(() => {
            if (!values.ImportPreferences.RouteCodeID) {
              confirmDialog({
                closable: false,
                message: t('sts.txt.question.use.a.routing.code'),
                header: t('sts.txt.question'),
                acceptLabel: t('sts.btn.no'),
                acceptClassName: 'p-button-secondary',
                rejectLabel: t('sts.btn.yes'),
                rejectClassName: 'p-button-primary',
                accept: () => {
                  setTimeout(() => {
                    requestImport(values);
                  }, 100);
                },
                reject: () => {
                  refRouteCodeField.current.focus();
                },
                icon: 'pi pi-question-circle text-blue-400',
              });
            } else {
              requestImport(values);
            }
          }, 100);
        },
        icon: 'pi pi-question-circle text-blue-400',
      });
    } else if (!values.ImportPreferences.RouteCodeID) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.question.use.a.routing.code'),
        header: t('sts.txt.question'),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'p-button-primary',
        accept: () => {
          setTimeout(() => {
            requestImport(values);
          }, 100);
        },
        reject: () => {
          refRouteCodeField.current.focus();
        },
        icon: 'pi pi-question-circle text-blue-400',
      });
    } else {
      requestImport(values);
    }
  };

  const GREEN = ['CREATE', 'UPDATE'];
  const getStatusColor = ({ STSQuantity, Status }) => {
    if (STSQuantity === 0 && GREEN.includes(Status)) return 'status-yellow';
    else if (STSQuantity > 0 && GREEN.includes(Status)) return 'status-green';
    else if (Status === 'NO IMPORT') return 'status-gray';
    else return 'status-blue';
  };

  const calculation = ({ ImportQuantity, LabelsNeeded }) => {
    const clearPLM = ImportQuantity / LabelsNeeded;
    const PLM = Math.ceil(clearPLM);
    const isFractional = !Number.isInteger(clearPLM);
    const MOFB = PLM * (LabelsNeeded - (!isFractional ? 0 : 1));
    const MOPL = ImportQuantity - MOFB;
    return { isFractional, PLM, MOFB, MOPL };
  };

  const calculateByLabelsNeeded = ({ ImportQuantity, LabelsNeeded, rowIndex }, field) => {
    const { isFractional, PLM, MOFB, MOPL } = calculation({ ImportQuantity, LabelsNeeded });
    if (ImportQuantity < LabelsNeeded || MOPL < 0 || (isFractional && !MOPL) || MOPL > PLM) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.label.quantity.entry.incorrect'),
        header: t('sts.txt.error'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          formTable.resetField(field.name);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
      return;
    }
    formTable.setValue(`Parts[${rowIndex}].PerLabelMarks`, PLM);
    formTable.setValue(`Parts[${rowIndex}].MarksOnFullBarcodes`, MOFB);
    formTable.setValue(`Parts[${rowIndex}].MarksOnPartialLabel`, MOPL);
  };

  const saveDiscardTypes = (data) => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.question.save.discard.types'),
      header: t('sts.txt.question'),
      acceptLabel: t('sts.btn.no'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.yes'),
      rejectClassName: 'p-button-primary',
      reject: async () => {
        try {
          await kissJobRecordsUpdateCash({ Parts: formTable.getValues().Parts, JobID: data.JobID });
          await kissSaveDiscardTypes({ DiscardTypes: data.DiscardTypes });
          if (!refWithSettings.current) {
            refWithSettings.current = true;
            window.history.pushState(null, '', `${window.location.href}&with_settings=true`);
          }
          updateViewInfo(data);
        } catch (e) {
          confirmDialog({
            closable: false,
            message: t(e.response.data.Detail),
            header: t(e.response.data.Message),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-times-circle text-yellow-500',
          });
        }
      },
      icon: 'pi pi-question-circle text-blue-400',
    });
  };

  const requestApplySettings = async (data, updateData = true) => {
    try {
      await kissJobRecordsUpdateCash({ Parts: formTable.getValues().Parts, JobID: data.JobID });
      await kissSavePreferences(removeEmptyParams(data.ImportPreferences), { job_id: data.JobID });
      if (formFilter.dirtyFields.DiscardTypes) {
        await kissSaveDiscardTypes({ DiscardTypes: data.DiscardTypes });
      }
      formFilter.reset(formFilter.getValues());
      if (!refWithSettings.current) {
        refWithSettings.current = true;
        window.history.pushState(null, '', `${window.location.href}&with_settings=true`);
      }
      updateData && updateViewInfo(data);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: t(e.response.data.Detail),
        header: t(e.response.data.Message),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const applySettingsAccept = async (values) => {
    checkEmptyRouteCodeInTable(values);
  };

  const applySettingsReject = async (values) => {
    await requestApplySettings(values, false);
    checkEmptyRouteCodeInTable(values);
  };

  const applySettings = (data, accept = () => {}, reject) => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.question.discard.types'),
      header: t('sts.txt.question'),
      acceptLabel: t('sts.btn.no'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.yes'),
      rejectClassName: 'p-button-primary',
      accept: () => {
        setTimeout(() => accept(data), 100);
      },
      reject: () => {
        setTimeout(() => {
          reject ? reject(data) : requestApplySettings(data);
        }, 100);
      },
      icon: 'pi pi-question-circle text-blue-400',
    });
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const RenderTable = useMemo(() => {
    return !initialTableHeight ? null : (
      <DataTable
        ref={tableRef}
        size="small"
        loading={loading}
        dataKey="UniqueNumber"
        onCopy={onCopy}
        scrollHeight={initialTableHeight}
        scrollable
        value={formTable.getValues().Parts}
        showGridlines
        removableSort
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(e) => {
          setSelected(e.value);
          refSelected.current = e.value;
        }}
        sortMode="multiple"
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        metaKeySelection
        onValueChange={(data) => {
          formTable.reset({ Parts: data });
        }}
        onColReorder={setOrderByColID}
        onColumnResizeEnd={setSizeByColID}
        paginator
        rows={100}
        rowsPerPageOptions={[25, 50, 100]}
      >
        {tableSettings.Entries?.map((col) => {
          const colSize = col.Size || DEFAULT_CELL_WIDTH;
          const fieldID = tableSettings.Descs.find(({ ID }) => ID === col.ID).FieldID;
          return (
            <Column
              key={col.ID}
              columnKey={col.ID}
              headerTooltip={t(col.ID)}
              headerTooltipOptions={{ position: 'top' }}
              field={fieldID}
              sortable
              body={(rowData, { rowIndex }) => {
                if (fieldID === 'LabelsNeeded') {
                  const { ImportQuantity } = rowData;
                  return (
                    <div tabIndex={0} style={{ width: colSize }}>
                      <Controller
                        name={`Parts[${rowIndex}].LabelsNeeded`}
                        control={formTable.control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            disabled={ImportQuantity === 1}
                            useGrouping={false}
                            min={1}
                            onBlur={(e) => {
                              if (e.target.value && Number(e.target.value) > 0) {
                                calculateByLabelsNeeded(
                                  {
                                    ImportQuantity,
                                    LabelsNeeded: Number(e.target.value),
                                    rowIndex,
                                  },
                                  field,
                                );
                              }
                              if (
                                e.target.value &&
                                e.target.value != 0 &&
                                e.target.value <= ImportQuantity
                              )
                                return;
                            }}
                            onFocus={(e) => e.target.select()}
                            onChange={debounce((e) =>
                              field.onChange(e.value === null ? '' : e.value),
                            )}
                            className={classNames({
                              'w-full': true,
                              required: ImportQuantity != 1,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        )}
                      />
                    </div>
                  );
                }

                if (fieldID === 'Status') {
                  return (
                    <div tabIndex={0} style={{ width: colSize }}>
                      <Controller
                        name={`Parts[${rowIndex}].Status`}
                        control={formTable.control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            style={{ background: getStatusColor(rowData), height: 22 }}
                            itemTemplate={(value) =>
                              hideStatuses.includes(value.value) ? null : (
                                <DropdownItemTooltip
                                  id={`Status_${trimAll(value.value)}`}
                                  label={value.label}
                                />
                              )
                            }
                            options={STATUS_OPTIONS}
                            onChange={({ value }) => {
                              if (value === 'SUMMARIZE') {
                                formTable.setValue(`Parts[${rowIndex}].LabelsNeeded`, 1);
                                calculateByLabelsNeeded(
                                  {
                                    ImportQuantity:
                                      formTable.getValues().Parts[rowIndex].ImportQuantity,
                                    LabelsNeeded: 1,
                                    rowIndex,
                                  },
                                  field,
                                );
                              }
                              field.onChange(value);
                            }}
                            className={classNames({
                              'w-full': true,
                              [getStatusColor(rowData)]: true,
                            })}
                            pt={{
                              item: () => {
                                return 'test-class';
                              },
                            }}
                          />
                        )}
                      />
                    </div>
                  );
                }

                return (
                  <div tabIndex={0} style={{ width: colSize }}>
                    <Controller
                      name={`Parts[${rowIndex}].${fieldID}`}
                      control={formTable.control}
                      render={({ field }) =>
                        PREPARE_BODY_FOR_FIELD[fieldID]?.(field.value) || field.value
                      }
                    />
                  </div>
                );
              }}
              header={t(col.ID)}
              headerStyle={{ maxWidth: colSize }}
            ></Column>
          );
        })}
      </DataTable>
    );
  }, [formTable.getValues().Parts, loading, selected, initialTableHeight, tableSettings.Entries]);

  return !Object.keys(data).length ? (
    <div className="h-full flex justify-content-center align-items-center">
      <ProgressSpinner
        style={{ width: '50px', height: '50px' }}
        pt={{
          circle: { style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' } },
        }}
      />
    </div>
  ) : (
    <div id="kiss-import-configure" className="fadein flex flex-column h-full p-2">
      <Dialog visible={loadingReportsLoads} style={{ minWidth: 400, height: 100 }} closable={false}>
        {`${t('sts.txt.processing')}...`}
      </Dialog>
      <Dialog
        header={t('sts.txt.notice')}
        visible={startImport}
        style={{ minWidth: 400, height: 100 }}
        closable={false}
      >
        {!importProgress ? (
          `${t('sts.txt.processing')}...`
        ) : (
          <p className="m-0">{importProgress}</p>
        )}
      </Dialog>
      <div className="flex justify-content-between align-items-center">
        <div />
        <GoToRootWindow trigger={imported} />
      </div>
      <div className="mb-3">
        <form className="p-fluid">
          <div className="my-1 flex">
            <div className="mr-4 w-26rem">
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.job.num')}:</div>
                <div className="flex align-items-center">
                  <span className="mr-4">{data.Job.Number}</span>
                  <>
                    <Checkbox disabled checked={data.Job.Metric} />
                    <label className="ml-2">{t('sts.label.metric')}</label>
                  </>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.date')}:</div>
                <div className="flex align-items-center">
                  <span>{`${data.FileHeader.Date} ${data.FileHeader.Time}`}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.employee.num')}:</div>
                <div className="flex align-items-center">
                  <span>{data.FileHeader.OriginalEmployeeNumber}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.save.remarks.info')}:</div>
                <Controller
                  name="ImportPreferences.SaveRemarksInfo"
                  control={formFilter.control}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      placeholder={t('sts.status.noneTr')}
                      options={[
                        t('sts.label.remarks'),
                        t('sts.label.control.number'),
                        t('table.idfiles.erection_dwg'),
                        t('sts.label.description'),
                      ]}
                      className={classNames({
                        'w-15rem': true,
                      })}
                    />
                  )}
                />
              </div>
              <div className="flex align-items-center mb-2">
                <Controller
                  name="ImportPreferences.NotesContainCamberInfo"
                  control={formFilter.control}
                  render={({ field }) => (
                    <>
                      <Checkbox {...field} inputId="ContainNumberInfo" checked={field.value} />
                      <label htmlFor="ContainNumberInfo" className="ml-2">
                        {t('sts.label.notes.contain.camber.info')}
                      </label>
                    </>
                  )}
                />
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.area.other')}:</div>
                <Controller
                  name="ImportPreferences.Area"
                  control={formFilter.control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={classNames({
                        'w-15rem': true,
                      })}
                    />
                  )}
                />
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.routing.code')}:</div>
                <Controller
                  name="ImportPreferences.RouteCode"
                  control={formFilter.control}
                  render={({ field }) => (
                    <AutoComplete
                      inputRef={refRouteCodeField}
                      {...field}
                      virtualScrollerOptions={{
                        itemSize: DEFAULT_ROW_HEIGHT,
                      }}
                      itemTemplate={(value, index) => (
                        <DropdownItemTooltip id={`Process_${index}`} label={value.label} />
                      )}
                      dropdown
                      onFocus={(e) => {
                        if (!refRouteCode.current) {
                          const MATCH = routeCodesSuggestions.find(
                            ({ label }) => label === e.target.value,
                          );
                          refRouteCode.current = MATCH?.label || null;
                        }
                      }}
                      onSelect={(e) => {
                        field.onChange(e.value.label);
                        formFilter.setValue('ImportPreferences.RouteCodeID', e.value.value);
                        refRouteCode.current = null;
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (!e.target.value) {
                            field.onChange('');
                            formFilter.setValue('ImportPreferences.RouteCodeID', null);
                            refRouteCode.current = null;
                            return;
                          }
                          const MATCH = routeCodesSuggestions.find(
                            ({ label }) => label === e.target.value,
                          );
                          if (!MATCH) {
                            field.onChange(refRouteCode.current);
                          }
                        }, 400);
                      }}
                      completeMethod={(e) => matchRouteCode(e.query)}
                      suggestions={routeCodesSuggestions}
                      className={classNames({
                        'w-15rem': true,
                      })}
                    />
                  )}
                />
              </div>
            </div>

            <div className="mr-4 w-26rem">
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.job.name')}:</div>
                <span className="mr-4">{data.Job.Title}</span>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.customer.number')}:</div>
                <div className="flex align-items-center">
                  <span>{data.Job.CustomerNumber}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.job.po.number')}:</div>
                <div className="flex align-items-center">
                  <span>{data.Job.PO}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.short.shop.order.number')}:</div>
                <div className="flex align-items-center mb-2">
                  <Controller
                    name="ImportPreferences.ShopOrder"
                    control={formFilter.control}
                    render={({ field }) => (
                      <AutoComplete
                        inputRef={refRouteCodeField}
                        {...field}
                        virtualScrollerOptions={{
                          itemSize: DEFAULT_ROW_HEIGHT,
                        }}
                        itemTemplate={(value, index) => (
                          <DropdownItemTooltip id={`ShopOrder_${index}`} label={value.label} />
                        )}
                        dropdown
                        onChange={(e) => {
                          field.onChange((e.value?.label || e.value).toUpperCase());
                        }}
                        onSelect={(e) => {
                          field.onChange(e.value.label);
                          formFilter.setValue('ImportPreferences.ShopOrder', e.value.value);
                        }}
                        completeMethod={(e) => matchShopOrder(e.query)}
                        suggestions={shopOrderSuggestions}
                        className={classNames({
                          'w-15rem': true,
                        })}
                        maxLength={30}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.release.num')}:</div>
                <div className="flex align-items-center">
                  <span>{data.Job.Release}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.records.to.import')}:</div>
                <div className="flex align-items-center">
                  <span>{localData?.FileHeader?.TotalRecords}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.qty.to.import')}:</div>
                <div className="flex align-items-center">
                  <span>{localData?.FileHeader?.TotalQtyToImport}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.min.weight.id')}:</div>
                <div className="flex align-items-center">
                  <span>{localData?.ImportPreferences?.WeightPrompt}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.min.quantity.id')}:</div>
                <div className="flex align-items-center">
                  <span>{localData?.ImportPreferences?.ImportQuantityPrompt}</span>
                </div>
              </div>
              <div className="flex align-items-center mb-2">
                <Controller
                  name="ImportPreferences.KeepMinors"
                  control={formFilter.control}
                  render={({ field }) => (
                    <>
                      <Checkbox {...field} inputId="KeepMinors" checked={field.value} />
                      <label htmlFor="KeepMinors" className="ml-2">
                        {t('table.jobs.keep_minors_import')} ({t('sts.label.job')} ={' '}
                        {t(
                          `sts.btn.${
                            formFilter.getValues().ImportPreferences?.Prefs?.KeepMinors
                              ? 'yes'
                              : 'no'
                          }`,
                        )}
                        )
                      </label>
                    </>
                  )}
                />
              </div>
            </div>

            <div className="w-26rem">
              <div className="flex align-items-center mb-2">
                <div className="mr-4 w-10rem">{t('sts.label.division')}:</div>
                <div className="flex align-items-center">
                  <span>{data.Job.Division}</span>
                </div>
              </div>
              <Button
                className="mb-2"
                label={t('sts.btn.save.discard.types')}
                size="small"
                onClick={formFilter.handleSubmit(saveDiscardTypes)}
              />
              <div>
                <DataTable
                  scrollHeight={170}
                  onCopy={onCopy}
                  scrollable
                  value={formFilter.getValues().DiscardTypes}
                  showGridlines
                  dataKey="Shape"
                  size="small"
                  onValueChange={(data) => {
                    formFilter.reset({ ...formFilter.getValues(), DiscardTypes: data });
                  }}
                >
                  <Column
                    field="Shape"
                    sortable
                    header={t('sts.label.shape')}
                    headerTooltip={t('sts.label.shape')}
                    headerTooltipOptions={{ position: 'top' }}
                  ></Column>
                  <Column
                    header={t('sts.label.exclude')}
                    headerTooltip={t('sts.label.exclude')}
                    headerTooltipOptions={{ position: 'top' }}
                    body={({ Summarized }, { rowIndex }) => (
                      <Controller
                        name={`DiscardTypes[${rowIndex}].Excluded`}
                        control={formFilter.control}
                        render={({ field }) => (
                          <Checkbox {...field} disabled={Summarized} checked={field.value} />
                        )}
                      />
                    )}
                  ></Column>
                  <Column
                    header={t('sts.label.summarize')}
                    headerTooltip={t('sts.label.summarize')}
                    headerTooltipOptions={{ position: 'top' }}
                    headerClassName="status-blue"
                    body={({ Excluded }, { rowIndex }) => (
                      <Controller
                        name={`DiscardTypes[${rowIndex}].Summarized`}
                        control={formFilter.control}
                        render={({ field }) => (
                          <Checkbox {...field} disabled={Excluded} checked={field.value} />
                        )}
                      />
                    )}
                  ></Column>
                </DataTable>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="flex-auto">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable;
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2" style={{ marginTop: 60 }}>
        <TableSettingsBtn
          tableID={TABLE_ID}
          tableCurrentEntries={tableSettings?.Entries}
          save={tableSettingsSave}
          openFromRoutePath={window.opener?.name}
        />
        <Button
          disabled={!data.Parts.length || !Edit}
          label={t('sts.btn.import')}
          size="small"
          onClick={formFilter.handleSubmit(updateImport)}
        />
        <Button
          label={t('sts.btn.apply.settings')}
          size="small"
          onClick={formFilter.handleSubmit((data) => applySettings(data))}
        />
        <Button
          label={t(
            hideIgnored ? 'sts.btn.import.show.ignore.items' : 'sts.btn.import.hide.ignore.items',
          )}
          size="small"
          onClick={() => setHideIgnored((prevState) => !prevState)}
        />
        <MultiSelectionUpdate
          disabled={!selected.length}
          success={(value) => {
            const UPDATED_DATA = formTable.getValues().Parts;
            const SELECTED_UPDATED = [];
            selected.forEach(({ UniqueNumber }) => {
              const ind = UPDATED_DATA.findIndex((item) => item.UniqueNumber === UniqueNumber);
              UPDATED_DATA[ind].Status = value;
              SELECTED_UPDATED.push(UPDATED_DATA[ind]);
            });
            setSelected(SELECTED_UPDATED);
            formTable.reset({ Parts: UPDATED_DATA });
          }}
        />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default KissImportTable;
