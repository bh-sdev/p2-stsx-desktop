import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';

import {
  statusCodesAll,
  statusCodesProcesses,
  statusCodesDelete,
  statusCodesNew,
  statusCodesUpdate,
  statusCodesRefEndFor,
  associationsGet,
  employeeStatusCodeGet,
  statusCodeEndForCustomProcess,
} from 'api';
import { removeEmptyParams } from 'api/general';
import {
  debounce,
  noNullValues,
  noSpaceOnStart,
  trimStartEnd,
  validationNumberLength,
} from 'utils';
import { ContextEditStatusCodes } from '.';

import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';

import { FORMS_CONFIG } from 'configs';
import { DEFAULT_ROW_HEIGHT, PUSH_TRANSACTION_NOT_DISABLED } from 'const';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import CustomInputMultiselect from 'components/CustomInputMultiselect';

const StatusCodeValidationSchema = yup.object({
  AssociationID: yup.string().trim().required(),
  StatusCode: yup.string().trim().required(),
  ProcessID: validationNumberLength(yup, FORMS_CONFIG.FORM_STATUS_CODE.fieldLength.ProcessID),
  Process: yup.string().trim().required(),
});

const InfoBlock = ({ current, cancel, created, updated, deleted }) => {
  const { refToast } = useContext(GlobalContext);
  const [associations, setAssociations] = useState();
  const [statusCodeInfo, setStatusCodeInfo] = useState({});
  const [processSuggestions, setProcessSuggestions] = useState([]);
  const [endForStatusSuggestions, setEndForStatusSuggestions] = useState([]);
  const [customProcess, setCustomProcess] = useState([]);
  const {
    accounts,
    matchSelect,
    setIsEdit,
    isEdit,
    isNew,
    withInactive,
    clearStart,
    Edit,
    Delete,
  } = useContext(ContextEditStatusCodes);
  const { t } = useTranslation();
  const [busy, setIsBusy] = useState(false);
  const [statusesSuggestions, setStatusesSuggestions] = useState([]);
  const [classIds, setClassIds] = useState([]);
  const [isStatusCodeDisabled, setIsStatusCodeDisabled] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(StatusCodeValidationSchema),
  });

  const WatcherProcess = useWatch({ control, name: 'Process' });
  const WatcherProcessID = useWatch({ control, name: 'ProcessID' });

  const refProcesses = useRef([]);
  const refProcess = useRef(null);

  const refEndForStatuses = useRef([]);
  const refEndStatus = useRef(null);
  const refReqXferStatus = useRef(null);
  const refReqBundleStatus = useRef(null);

  const refFullListOfStatuses = useRef([]);

  useEffect(() => {
    if (statusCodeInfo.ID) {
      initClassIds();
      initProcesses();
      getAllStatuses();
    }
  }, [statusCodeInfo]);

  const getAllStatuses = async () => {
    try {
      const { Entries } = await statusCodesAll({
        with_inactive: true,
        association_id: statusCodeInfo.AssociationID,
      });
      refFullListOfStatuses.current = Entries;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  useEffect(() => {
    if (
      WatcherProcessID &&
      String(WatcherProcessID).length <= 9 &&
      refProcesses.current.includes(WatcherProcess)
    ) {
      initEndStatuses('', WatcherProcess, WatcherProcessID);
    }
  }, [WatcherProcess, WatcherProcessID]);

  const getAssociations = async () => {
    const res = await associationsGet();
    setAssociations(res);
  };

  useEffect(() => {
    getAssociations();
  }, []);

  useEffect(() => {
    if (current.ID) {
      setIsStatusCodeDisabled(false);
      initStatusCodeInfo();
    } else {
      setTimeout(() => {
        setIsStatusCodeDisabled(true);
        !!Object.keys(current).length &&
          setStatusCodeInfo({ ...current, EmployeeClassCodesModify: [] });
        !!Object.keys(current).length &&
          reset(noNullValues({ ...current, EmployeeClassCodesModify: [] }));
        refEndStatus.current = null;
        refReqXferStatus.current = null;
        refReqBundleStatus.current = null;
      }, 100);
    }
  }, [current]);

  useEffect(() => {
    reset(noNullValues(statusCodeInfo));
  }, [isEdit, statusCodeInfo]);

  const initStatusCodeInfo = async () => {
    let EmployeeClassCodesModify = [];
    if (current.EmployeeClassCodes?.length > 0) {
      EmployeeClassCodesModify = current.EmployeeClassCodes.map((i) => i.EmployeeClassID);
    }
    setStatusCodeInfo({ ...current, EmployeeClassCodesModify });
    setValue('PushTransactionToThirdParty', !!PUSH_TRANSACTION_NOT_DISABLED[current.Process]);
    reset(noNullValues({ ...current, EmployeeClassCodesModify }));
  };

  const initProcesses = async () => {
    try {
      const { Entries } = await statusCodesProcesses();
      refProcesses.current = Entries;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const initClassIds = async () => {
    try {
      const { Entries } = await employeeStatusCodeGet();
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

  const matchProcess = async (prefix) => {
    setProcessSuggestions(
      refProcesses.current.filter((ID) => ID.toLowerCase().includes(prefix.toLowerCase())),
    );
  };

  const matchEndForStatus = async (prefix) => {
    setEndForStatusSuggestions(
      refEndForStatuses.current.filter(({ label }) => {
        return label.toLowerCase().includes(prefix.toLowerCase());
      }),
    );
  };
  const matchReqStatus = async (prefix) => {
    const { Entries } = await statusCodeEndForCustomProcess({
      prefix,
      status_code_id: statusCodeInfo.ID,
      association_id: statusCodeInfo.AssociationID || getValues().AssociationID,
    });
    const RES = Entries.map((item) => ({ label: item.Code, value: item.ID }));
    setCustomProcess(RES);
  };

  const matchStatuses = async (prefix) => {
    try {
      const { Entries } = await statusCodesAll({
        prefix,
        with_inactive: withInactive,
        association_id: getValues().AssociationID,
      });
      const RES = Entries.map((item) => ({ label: item.Code, value: item.ID }));
      setStatusesSuggestions(RES);
      return RES;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const createNew = async (data) => {
    data.AddEmployeeClassCodes = [];
    if (data?.EmployeeClassCodesModify.length > 0) {
      data.EmployeeClassCodesModify.map((i) => {
        data.AddEmployeeClassCodes.push({
          EmployeeClassID: i,
        });
      });
    }
    try {
      setIsBusy(true);
      const res = await statusCodesNew(noSpaceOnStart(removeEmptyParams(data)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.status.created'),
        header: t('sts.txt.status.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.status.code')} ${data.StatusCode}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
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
    } finally {
      setIsBusy(false);
    }
  };

  const update = async (data) => {
    let currentCodes = [];
    let newCodes = [];
    let removedCodes = [];
    if (data.EmployeeClassCodes.length) {
      data.EmployeeClassCodes.map((i) => {
        currentCodes.push(i.EmployeeClassID);
      });
      data.EmployeeClassCodesModify.map((classModify) => {
        if (currentCodes.indexOf(classModify) === -1) {
          newCodes.push({ EmployeeClassID: classModify });
        }
      });
      data.EmployeeClassCodes.map((currentClass) => {
        if (data.EmployeeClassCodesModify.indexOf(currentClass.EmployeeClassID) === -1) {
          removedCodes.push({ StatusValidClassID: currentClass.StatusValidClassID });
        }
      });
    } else if (data.EmployeeClassCodesModify.length) {
      data.EmployeeClassCodesModify.map(
        (i) =>
          i &&
          newCodes.push({
            EmployeeClassID: i,
          }),
      );
    }
    data.AddEmployeeClassCodes = newCodes;
    data.RemoveEmployeeClassCodes = removedCodes;
    try {
      setIsBusy(true);
      const res = await statusCodesUpdate(current.ID, noSpaceOnStart(removeEmptyParams(data)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.status.updated'),
        header: t('sts.txt.status.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.status.code')} ${data.StatusCode}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
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
    } finally {
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    try {
      await statusCodesDelete(current.ID);
      setIsEdit(false);
      deleted();
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }
  };

  const deleteStatusCode = async () => {
    try {
      await statusCodesDelete(current.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.this.code.x', {
          0: statusCodeInfo.StatusCode,
        }),
        header: t('sts.txt.remove.code'),
        icon: 'pi pi-exclamation-triangle text-yellow-500',
        rejectClassName: 'p-button-danger',
        acceptLabel: t('sts.btn.cancel'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.delete'),
        reject: () => {
          setTimeout(() => {
            confirmDialog({
              closable: false,
              message: t('1072'),
              acceptLabel: t('sts.btn.no'),
              acceptClassName: 'p-button-secondary',
              rejectLabel: t('sts.btn.yes'),
              rejectClassName: 'p-button-primary',
              accept: deleteRequest,
              icon: 'pi pi-question-circle text-blue-400',
            });
          }, 100);
        },
      });
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

  const initEndStatuses = async (prefix, process, process_id) => {
    !PUSH_TRANSACTION_NOT_DISABLED[process] && setValue('PushTransactionToThirdParty', false);
    try {
      const { Entries } = await statusCodesRefEndFor({
        prefix,
        process,
        process_id,
        status_code_id: statusCodeInfo.ID,
        association_id: statusCodeInfo.AssociationID || getValues().AssociationID,
      });
      refEndForStatuses.current = Entries.map((item) => ({ label: item.Code, value: item.ID }));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const StatusCodesFieldFlow = (value, field) => {
    const STATUS_CODE_DIVISION = accounts.find(
      ({ StatusCode, AssociationID }) =>
        getValues().AssociationID === AssociationID && StatusCode === value,
    );
    if ((isNew || isEdit) && STATUS_CODE_DIVISION) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.status.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(statusCodeInfo.StatusCode);
        },
        reject: () => {
          matchSelect(STATUS_CODE_DIVISION);
        },
      });
    } else {
      if ((isNew || isEdit) && !STATUS_CODE_DIVISION) return;
      if (!STATUS_CODE_DIVISION) {
        refFullListOfStatuses.current.find(({ Code }) => Code === value) &&
          confirmDialog({
            closable: false,
            message: t('sts.txt.status.inactive'),
            header: t('sts.txt.status.inactive'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(statusCodeInfo.StatusCode);
            },
          });
        !isEdit && !isNew && field.onChange(statusCodeInfo.StatusCode);
      } else {
        matchSelect(STATUS_CODE_DIVISION);
      }
    }
  };

  const isActiveFields = isNew || isEdit;

  return !Object.keys(statusCodeInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-end">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column pb-2">
            <AutoSizer className="flex-auto w-full">
              {({ height }) => (
                <ScrollPanel
                  style={{ width: '100%', height: `${height}px` }}
                  pt={{
                    content: {
                      className: 'p-0',
                    },
                    bary: {
                      className: 'bg-bluegray-300',
                    },
                  }}
                >
                  <div className="flex-auto w-30rem">
                    <form className="p-fluid">
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.fab.shop')}:</div>
                          <Controller
                            name="AssociationID"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Dropdown
                                disabled={!isActiveFields}
                                id={field.name}
                                {...field}
                                options={associations?.Entries?.map(({ ID, Name }) => ({
                                  label: Name,
                                  value: ID,
                                }))}
                                onChange={async (e) => {
                                  if (e.target.value !== statusCodeInfo.AssociationID) {
                                    setValue('EndForStatusCode', '');
                                    refEndStatus.current = null;

                                    setValue('ReqXferStatusCode', '');
                                    refReqXferStatus.current = null;

                                    setValue('ReqBundleStatusCode', '');
                                    refReqBundleStatus.current = null;

                                    const STATUS_CODE_DIVISION = accounts.find(
                                      ({ StatusCode, AssociationID }) =>
                                        e.target.value === AssociationID &&
                                        StatusCode === getValues().StatusCode,
                                    );
                                    if (STATUS_CODE_DIVISION) {
                                      confirmDialog({
                                        closable: false,
                                        message: t('sts.txt.status.exist', {
                                          0: STATUS_CODE_DIVISION.StatusCode,
                                        }),
                                        acceptLabel: t('sts.btn.no'),
                                        acceptClassName: 'p-button-secondary',
                                        rejectLabel: t('sts.btn.yes'),
                                        rejectClassName: 'secondary',
                                        icon: 'pi pi-question-circle text-blue-400',
                                        accept: () => {
                                          field.onChange(getValues().AssociationID);
                                        },
                                        reject: () => {
                                          matchSelect(STATUS_CODE_DIVISION);
                                          field.onChange(e.target.value);
                                        },
                                      });
                                    } else {
                                      setValue('StatusCode', getValues().StatusCode);
                                      field.onChange(e.target.value);
                                    }
                                  } else {
                                    field.onChange(e.target.value);
                                  }
                                  setIsStatusCodeDisabled(false);
                                }}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('table.import.status')}:</div>
                          <Controller
                            name="StatusCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`StatusCode_${index}`}
                                    label={value.label}
                                  />
                                )}
                                disabled={isStatusCodeDisabled}
                                dropdown
                                onChange={(e) => {
                                  field.onChange((e.value?.label || e.value).toUpperCase());
                                }}
                                onSelect={(e) => {
                                  if (statusCodeInfo.StatusCode !== e.value.label) {
                                    StatusCodesFieldFlow(e.value.label, field);
                                  }
                                }}
                                onBlur={(e) => {
                                  field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                  setTimeout(() => {
                                    if (statusCodeInfo.StatusCode !== e.target.value) {
                                      StatusCodesFieldFlow(e.target.value, field);
                                    }
                                  }, 400);
                                }}
                                autoHighlight
                                field="label"
                                completeMethod={(e) => matchStatuses(e.query)}
                                suggestions={statusesSuggestions}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_STATUS_CODE.fieldLength.StatusCode}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.process.number')}:</div>
                          <Controller
                            name="ProcessID"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputNumber
                                {...field}
                                value={field.value === '' ? null : field.value}
                                disabled={!isActiveFields}
                                useGrouping={false}
                                id={field.name}
                                onChange={debounce((e) => field.onChange(e.value), 300)}
                                className={classNames({
                                  required: true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.description')}:</div>
                          <Controller
                            name="Description"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isActiveFields}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_STATUS_CODE.fieldLength.Description}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.process')}:</div>
                          <Controller
                            name="Process"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                disabled={!isActiveFields}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`Process_${index}`} label={value} />
                                )}
                                dropdown
                                onFocus={(e) => {
                                  if (!refProcess.current) {
                                    refProcess.current = e.target.value;
                                  }
                                }}
                                onSelect={(e) => {
                                  if (e.value !== refProcess.current) {
                                    setValue('EndForStatusCode', '');
                                    refEndStatus.current = null;
                                  }
                                  field.onChange(e.value);
                                  refProcess.current = null;
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const MATCH = refProcesses.current.includes(e.target.value);
                                    if (!MATCH) {
                                      field.onChange(refProcess.current);
                                    }
                                  }, 100);
                                }}
                                completeMethod={(e) => matchProcess(e.query)}
                                suggestions={processSuggestions}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.status.end.for')}:</div>
                          <Controller
                            name="EndForStatusCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                placeholder={t('sts.status.noneTr')}
                                disabled={!isActiveFields}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`EndForStatus_${index}`}
                                    label={value.label}
                                  />
                                )}
                                field="label"
                                dropdown
                                onFocus={(e) => {
                                  if (!refEndStatus.current) {
                                    refEndStatus.current = e.target.value;
                                  }
                                }}
                                onSelect={(e) => {
                                  field.onChange(e.value.label);
                                  setValue('EndForStatusID', e.value.value);
                                  refEndStatus.current = null;
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const MATCH = endForStatusSuggestions.find(
                                      ({ label }) => label === e.target.value,
                                    );
                                    if (!MATCH) {
                                      field.onChange(refEndStatus.current);
                                    }
                                  }, 100);
                                }}
                                completeMethod={(e) => matchEndForStatus(e.query)}
                                suggestions={endForStatusSuggestions}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.status.required.transfer')}:</div>
                          <Controller
                            name="ReqXferStatusCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                placeholder={t('sts.status.noneTr')}
                                value={getValues().Process === 'Fab Transfer' ? field.value : ''}
                                disabled={
                                  !isActiveFields || !(getValues().Process === 'Fab Transfer')
                                }
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`ReqXferStatus_${index}`}
                                    label={value.label}
                                  />
                                )}
                                field="label"
                                dropdown
                                onFocus={(e) => {
                                  if (!refReqXferStatus.current) {
                                    refReqXferStatus.current = e.target.value;
                                  }
                                }}
                                onSelect={(e) => {
                                  field.onChange(e.value.label);
                                  setValue('ReqXferStatusID', e.value.value);
                                  refReqXferStatus.current = null;
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const MATCH = endForStatusSuggestions.find(
                                      ({ label }) => label === e.target.value,
                                    );
                                    if (!MATCH) {
                                      field.onChange(refReqXferStatus.current);
                                    }
                                  }, 100);
                                }}
                                completeMethod={(e) => matchReqStatus(e.query)}
                                suggestions={customProcess}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.status.required.bundle')}:</div>
                          <Controller
                            name="ReqBundleStatusCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                placeholder={t('sts.status.noneTr')}
                                value={getValues().Process === 'Fab Bundled' ? field.value : ''}
                                disabled={
                                  !isActiveFields || !(getValues().Process === 'Fab Bundled')
                                }
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`ReqBundleStatus_${index}`}
                                    label={value.label}
                                  />
                                )}
                                field="label"
                                dropdown
                                onFocus={(e) => {
                                  if (!refReqBundleStatus.current) {
                                    refReqBundleStatus.current = e.target.value;
                                  }
                                }}
                                onSelect={(e) => {
                                  field.onChange(e.value.label);
                                  setValue('ReqBundleStatusID', e.value.value);
                                  refReqBundleStatus.current = null;
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const MATCH = endForStatusSuggestions.find(
                                      ({ label }) => label === e.target.value,
                                    );
                                    if (!MATCH) {
                                      field.onChange(refReqBundleStatus.current);
                                    }
                                  }, 100);
                                }}
                                completeMethod={(e) => matchReqStatus(e.query)}
                                suggestions={customProcess}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('label.status.accounting_code')}:</div>
                          <Controller
                            name="AccountingCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isActiveFields}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_STATUS_CODE.fieldLength.AccountingCode}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">
                            {t('table.status_description.thirdpty_station_name')}:
                          </div>
                          <Controller
                            name="ThirdPartyStationName"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isActiveFields}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={
                                  FORMS_CONFIG.FORM_STATUS_CODE.fieldLength.ThirdPartyStationName
                                }
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.txt.employee.class.codes')}:</div>
                          <Controller
                            name="EmployeeClassCodesModify"
                            control={control}
                            render={({ field, fieldState }) => (
                              <CustomInputMultiselect
                                {...field}
                                value={field.value?.map((ID) => ({
                                  Name: classIds.find(({ ClassID }) => ClassID === ID)?.ClassCode,
                                  ID,
                                }))}
                                readOnly
                                multiWithoutCtrl
                                placeholder={t('sts.status.noneTr')}
                                field="Name"
                                fieldValue="ID"
                                disabled={!isActiveFields}
                                suggestions={classIds.map(({ ClassID, ClassCode }) => ({
                                  Name: ClassCode,
                                  ID: ClassID,
                                }))}
                                shouldCompleteMethodSend={false}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`EmployeeClassCodesModify_${index}`}
                                    label={value.Name}
                                  />
                                )}
                                className={classNames({
                                  'max-w-18rem': true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="WorkerEmployeeNumberRequired"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="WorkerEmployeeNumberRequired"
                                  checked={field.value}
                                />
                                <label htmlFor="WorkerEmployeeNumberRequired" className="ml-2">
                                  {t('sts.txt.worker.employee.number.required')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="PercentageScan"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="PercentageScan"
                                  checked={field.value}
                                />
                                <label htmlFor="PercentageScan" className="ml-2">
                                  {t('sts.chk.labor.percentage.scan')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="AllowMultiScan"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="AllowMultiScan"
                                  checked={field.value}
                                />
                                <label htmlFor="AllowMultiScan" className="ml-2">
                                  {t('sts.txt.scans.allow.multiple')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="MtrPdfRequired"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="MtrPdfRequired"
                                  checked={field.value}
                                />
                                <label htmlFor="MtrPdfRequired" className="ml-2">
                                  {t('sts.txt.mtr.pdf.required')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="AllowStartIfPriorCodeNotComplete"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="AllowStartIfPriorCodeNotComplete"
                                  checked={field.value}
                                />
                                <label htmlFor="AllowStartIfPriorCodeNotComplete" className="ml-2">
                                  {t('sts.chk.allow.start.if.prior.incomplete')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="PushTransactionToThirdParty"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={
                                    !isActiveFields ||
                                    !PUSH_TRANSACTION_NOT_DISABLED[getValues()['Process']]
                                  }
                                  {...field}
                                  inputId="PushTransactionToThirdParty"
                                  checked={field.value}
                                />
                                <label htmlFor="PushTransactionToThirdParty" className="ml-2">
                                  {t('sts.txt.transaction.push.to.third.party')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="PromptComplete"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="PromptComplete"
                                  checked={field.value}
                                />
                                <label htmlFor="PromptComplete" className="ml-2">
                                  {t('sts.txt.prompt.for.100.complete')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="IsActive"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isActiveFields}
                                  {...field}
                                  inputId="IsActive"
                                  checked={field.value}
                                />
                                <label htmlFor="IsActive" className="ml-2">
                                  {t('sts.window.status.codes.active')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </ScrollPanel>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>

      <div className="flex justify-content-end gap-2">
        {isNew ? (
          <>
            <Button
              disabled={!isValid}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(createNew)}
            />
            {!clearStart && (
              <Button label={t('sts.btn.cancel')} disabled={busy} size="small" onClick={cancel} />
            )}
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.delete')}
              disabled={!Delete}
              severity="danger"
              size="small"
              onClick={deleteStatusCode}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            disabled={!Edit && !Delete}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
