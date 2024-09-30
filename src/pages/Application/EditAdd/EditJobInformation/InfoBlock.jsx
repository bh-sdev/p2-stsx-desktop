import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

import {
  generateIntegerId,
  noNullValues,
  noSpaceOnStart,
  trimStartEnd,
  validationNumberLength,
  maxNumberLength,
  searchInArray,
} from 'utils';
import { addressGetCollection } from 'api';
import { removeEmptyParams } from 'api/general';
import { FORMS_CONFIG } from 'configs';
import {
  getCustomers,
  getDefaults,
  getDivisions,
  getLabeLaseNames,
  getLabelNames,
  getNumbers,
  jobById,
  jobDelete,
  jobNew,
  updateJob,
} from 'api/api.jobs';
import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { ContextEditJobInformation } from './JobInfo';
import { DEFAULT_ROW_HEIGHT } from 'const';

const JobValidationSchema = yup.object({
  Number: yup.string().required(),
  CustomerNameWithHash: yup.lazy((value) => {
    if (typeof value === 'string') {
      return yup.string().required();
    }
    return yup.object().required();
  }),
  BarcodeFormName: yup.lazy((value) => {
    if (typeof value === 'string') {
      return yup.string().required();
    }
    return yup.object().required();
  }),
  Status: yup.string().required(),
  RFInterface: yup.string().required(),
  AssociationID: yup.string().required(),
  Efficiency: yup.lazy((value) => {
    if (value === '' || value === null) {
      return yup.string().nullable();
    }

    return validationNumberLength(yup, FORMS_CONFIG.FORM_JOB.fieldLength.Efficiency);
  }),
  Hours: yup.lazy((value) => {
    if (value === '' || value === null) {
      return yup.string().nullable();
    }

    return validationNumberLength(yup, FORMS_CONFIG.FORM_JOB.fieldLength.Hours);
  }),
});

const InfoBlock = ({ created, updated, deleted, current, cancel }) => {
  const { refToast } = useContext(GlobalContext);
  const {
    matchSelect,
    setIsEdit,
    isEdit,
    isNew,
    activeActions,
    withClosed,
    jobs,
    Delete,
    Edit,
    keepMinors,
  } = useContext(ContextEditJobInformation);
  const { t } = useTranslation();
  const [jobInfo, setJobInfo] = useState({});
  const [busy, setIsBusy] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [divisions, setDivisions] = useState(null);
  const [usedBarCode, setUsedBarCode] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const [adhesiveBarCode, setAdhesiveBarCode] = useState([]);
  const [labelLaseBarCodeBarCode, setLabelLaseBarCode] = useState([]);
  const customerNameWithHashRef = useRef(null);
  const barcodeFromRef = useRef(null);
  const defaultMetric = useRef(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(JobValidationSchema),
  });
  const customerValue = watch('CustomerID');
  const watchHeats = watch('ValidateHeats');

  const refFullListOfNumbers = useRef([]);
  const refDefaultBarcodeLabelFormat = useRef(null);
  const refDefaultLabelaseLabelFormat = useRef(null);

  useEffect(() => {
    getAllJobNumbers();
  }, []);

  const getAllJobNumbers = async () => {
    try {
      const { Entries } = await getNumbers({ include_closed: true });
      refFullListOfNumbers.current = Entries;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const getAddresses = async () => {
    if (jobInfo.CustomerID || customerValue) {
      const { Addresses } = await addressGetCollection({
        person_id: customerValue,
      });
      setAddresses(
        Addresses.sort((a, b) => (a.Type < b.Type ? -1 : 1)).map((item) => ({
          label: item.Type,
          value: item.ID,
        })),
      );
    }
  };
  const handleFocusJobs = async () => {
    const { Entries } = await getDivisions();
    const transformedData = Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)).map((item) => ({
      label: item.Name,
      value: item.ID,
    }));
    setDivisions(transformedData);
  };

  useEffect(() => {
    if (customerValue) {
      getAddresses();
    }
  }, [customerValue]);

  useEffect(() => {
    if (isEdit || isNew) {
      if (isNew) {
        getDefaults().then((data) => {
          setValue('KeepMinors', keepMinors);
          setValue('Metric', data.Metric);
          defaultMetric.current = data.Metric;
        });
      }
      getAllJobNumbers();
    }
  }, [isEdit, isNew]);

  useEffect(() => {
    reset(noNullValues(jobInfo));
  }, [isEdit]);

  useEffect(() => {
    if (current.ID) {
      loadJobInfo();
    } else {
      setJobInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadJobInfo = async () => {
    try {
      const res = await jobById(current.ID);
      const resultObj = {
        ...res,
        CustomerNameWithHash: `${res.CustomerName}#${res.CustomerNumber}`,
      };
      setJobInfo(resultObj);
      reset(noNullValues(resultObj));
      checkInvalidFieldsFromApi(res);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const checkInvalidFieldsFromApi = (data = jobInfo) => {
    if (!data.IsDefaultLabelaseLabelFormatValid) {
      setError('DefaultLabelaseLabelFormat', {
        type: 'validate',
        message: '',
      });
    }
    if (!data.IsDefaultBarcodeLabelFormatValid) {
      setError('DefaultBarcodeLabelFormat', {
        type: 'validate',
        message: '',
      });
    }
  };

  const createNew = async (data) => {
    const preparedData = {
      ...data,
      AssociationID: data.Division.value || data.AssociationID,
      Division: data.Division.label || data.Division,
      Efficiency: data.Efficiency === '' ? '' : data.Efficiency,
    };
    try {
      setIsBusy(true);
      const res = await jobNew(noSpaceOnStart(removeEmptyParams(preparedData)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.job.created'),
        header: t('sts.txt.job.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.job')} ${data.Number}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          accept: () => {
            setValue('Number', '');
            setError('Number', {
              type: 'validate',
              message: '',
            });
          },
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
    const preparedData = {
      ...data,
      AssociationID: data.Division.value || data.AssociationID,
      Division: data.Division.label,
      Efficiency: data.Efficiency,
    };
    try {
      setIsBusy(true);
      const res = await updateJob(current.ID, noSpaceOnStart(removeEmptyParams(preparedData)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.job.updated'),
        header: t('sts.txt.job.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.job')} ${data.Number}`,
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

  const fetchCustomers = async (query) => {
    const { Entries } = await getCustomers({ prefix: query });
    setCustomers(
      Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)).map((el) => {
        return {
          label: el.Name,
          value: el.ID,
        };
      }),
    );
  };

  const fetchBarCodeFrom = async (query) => {
    const { Entries } = await getCustomers({ prefix: query });
    setUsedBarCode(
      Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)).map((el) => {
        return {
          label: el.Name,
          value: el.ID,
        };
      }),
    );
  };
  useEffect(() => {
    handleFocusJobs();
  }, []);

  useEffect(() => {
    if (!watchHeats) {
      setValue('ValidatePipes', false);
      setValue('ValidateFittings', false);
    }
  }, [watchHeats]);

  useEffect(() => {
    if (jobInfo.ID) {
      getAddresses();
      fetchBarCodeFrom();
      fetchCustomers();
    }
  }, [jobInfo.ID]);

  const fetchAdhesiveBarCodeFrom = async (prefix = '') => {
    const { Entries } = await getLabelNames();
    setAdhesiveBarCode(searchInArray([t('sts.status.noneTr'), ...Entries], prefix));
  };
  const fetchLabelLaseBarCodeFrom = async (prefix = '') => {
    const { Entries } = await getLabeLaseNames();
    setLabelLaseBarCode(searchInArray([t('sts.status.noneTr'), ...Entries], prefix));
  };

  const deleteRequest = async () => {
    try {
      await jobDelete(jobInfo.ID);
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

  const deleteJob = async () => {
    try {
      await jobDelete(jobInfo.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.this.job', {
          0: jobInfo.Number,
        }),
        header: t('sts.txt.remove.job'),
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

  const jobNumberFieldFlow = (value, field) => {
    const JOB = jobs.find(({ Number }) => Number === value);
    if ((isNew || isEdit) && JOB) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.job.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(isEdit ? jobInfo.Number : null);
        },
        reject: () => {
          matchSelect(JOB);
        },
      });
    } else {
      if (!JOB) {
        refFullListOfNumbers.current.includes(value) &&
          confirmDialog({
            closable: false,
            message: t('426'),
            header: 426,
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(jobInfo.Number);
            },
          });
        !isEdit && !isNew && field.onChange(jobInfo.Number);
      } else {
        matchSelect(JOB);
      }
    }
  };

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await getNumbers(
        withClosed
          ? {
              prefix,
              include_closed: true,
            }
          : {
              prefix,
            },
      );
      setNumberSuggestions(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };
  return !Object.keys(jobInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-end">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column">
            <AutoSizer className="flex-auto w-full">
              {({ height }) => (
                <ScrollPanel
                  style={{ width: '100%', height: `${height}px` }}
                  pt={{
                    content: {
                      className: 'w-full',
                    },
                    bary: {
                      className: 'bg-bluegray-300',
                    },
                  }}
                >
                  <div className="flex align-items-center mb-2 w-12">
                    <div className="w-15rem">{t('sts.label.job.number')}:</div>
                    <Controller
                      name="Number"
                      control={control}
                      render={({ field, fieldState }) => (
                        <AutoComplete
                          {...field}
                          virtualScrollerOptions={{
                            itemSize: DEFAULT_ROW_HEIGHT,
                          }}
                          itemTemplate={(value, index) => (
                            <DropdownItemTooltip id={`Number_${index}`} label={value} />
                          )}
                          dropdown
                          onSelect={(e) => {
                            if (jobInfo.Number !== e.value) {
                              jobNumberFieldFlow(e.value, field);
                            }
                          }}
                          onBlur={(e) => {
                            setTimeout(() => {
                              field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                              if (jobInfo.Number !== e.target.value) {
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
                          completeMethod={(event) => matchNumber(event.query)}
                          suggestions={numberSuggestions}
                          className={classNames({
                            required: true,
                            'w-full': true,
                            'p-invalid': fieldState.invalid,
                          })}
                          maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Number}
                        />
                      )}
                    />
                  </div>
                  <div className="flex align-items-center mb-2 w-12">
                    <div className="w-15rem">{t('sts.col.label.customer.number')}:</div>
                    <Controller
                      name="CustomerNameWithHash"
                      control={control}
                      render={({ field, fieldState }) => {
                        return (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            field="label"
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip
                                id={`CustomerNameWithHash_${index}`}
                                label={value.label}
                              />
                            )}
                            onFocus={(e) => {
                              if (!customerNameWithHashRef.current) {
                                customerNameWithHashRef.current = e.target.value;
                              }
                            }}
                            onChange={(e) => {
                              field.onChange(e.target.value || e.value);
                              if (jobInfo.CustomerNameWithHash !== e.value) {
                                setValue('ShipTo', '');
                                setValue('BillTo', '');
                              }
                            }}
                            onSelect={(e) => {
                              field.onChange(e.value.label);
                              setValue('CustomerID', e.value.value);
                              customerNameWithHashRef.current = null;
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                if (!customers.find(({ label }) => label === e.target.value)) {
                                  field.onChange(customerNameWithHashRef.current);
                                  customerNameWithHashRef.current = null;
                                }
                              }, 400);
                            }}
                            disabled={!isNew && !isEdit}
                            dropdown
                            autoHighlight
                            completeMethod={(event) => fetchCustomers(event.query)}
                            suggestions={customers}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        );
                      }}
                    />
                  </div>
                  <div className="flex align-items-center mb-2 w-12">
                    <div className="w-15rem">{t('sts.label.barcode.use.form')}:</div>
                    <Controller
                      name="BarcodeFormName"
                      control={control}
                      render={({ field, fieldState }) => {
                        return (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            field="label"
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip
                                id={`BarcodeFormName_${index}`}
                                label={value.label}
                              />
                            )}
                            onFocus={(e) => {
                              if (!barcodeFromRef.current) {
                                barcodeFromRef.current = e.target.value;
                              }
                            }}
                            onChange={(e) => {
                              field.onChange(e.target.value || e.value);
                            }}
                            onSelect={(e) => {
                              field.onChange(e.value);
                              setValue('BarcodeForm', e.value.value);
                              barcodeFromRef.current = null;
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                if (!usedBarCode.find(({ label }) => label === e.target.value)) {
                                  field.onChange(barcodeFromRef.current);
                                  barcodeFromRef.current = null;
                                }
                              }, 400);
                            }}
                            disabled={!isNew && !isEdit}
                            dropdown
                            autoHighlight
                            completeMethod={(event) => fetchBarCodeFrom(event.query)}
                            suggestions={usedBarCode}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        );
                      }}
                    />
                  </div>

                  <div className="mb-2 flex flex-row align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.weight')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Weight"
                        control={control}
                        render={({ field }) => (
                          <>
                            <InputNumber
                              {...field}
                              value={field.value === '' ? null : field.value}
                              disabled
                              className={classNames({
                                'w-full': true,
                              })}
                            />
                            <div className="ml-2">
                              {watch('Metric')
                                ? t('sts.txt.weight.metric')
                                : t('sts.txt.weight.imperial')}
                            </div>
                          </>
                        )}
                      />
                      <Controller
                        name="Metric"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Checkbox
                              disabled={!isEdit && !isNew}
                              onChange={(event) => {
                                if (event.checked !== defaultMetric.current) {
                                  confirmDialog({
                                    closable: false,
                                    message: t('1311'),
                                    header: t('1311'),
                                    acceptLabel: t('sts.btn.ok'),
                                    rejectClassName: 'hidden',
                                    icon: 'pi pi-info-circle text-green-500',
                                  });
                                }
                                field.onChange(event);
                              }}
                              inputId="Metric"
                              checked={field.value}
                              className={classNames({
                                'ml-2': true,
                              })}
                            />
                            <label htmlFor="Metric" className="ml-2 flex-shrink-0">
                              {t('sts.txt.job.metric.weights.and.dimensions')}
                            </label>
                          </>
                        )}
                      />
                      <Button
                        className="flex-shrink-0 ml-2"
                        label={t('sts.txt.part.recal')}
                        disabled
                        size="small"
                        onClick={() => {}}
                      />
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.external_number')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="ExternalJobNumber"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.ExternalJob}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('sts.label.association')}:</div>
                        <Controller
                          name="AssociationID"
                          control={control}
                          render={({ field }) => {
                            return (
                              <Dropdown
                                {...field}
                                options={divisions}
                                disabled={!isEdit && !isNew}
                                className={classNames({
                                  'w-full': true,
                                  required: true,
                                })}
                              />
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.status')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Status"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            options={[t('sts.txt.dropdown.open'), t('sts.txt.dropdown.closed')]}
                            disabled={!isEdit && !isNew}
                            className={classNames({
                              'w-5': true,
                              required: true,
                            })}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('sts.label.ship.to')}:</div>
                        <Controller
                          name="ShipTo"
                          control={control}
                          render={({ field }) => (
                            <Dropdown
                              disabled={(!isEdit && !isNew) || !customerValue}
                              {...field}
                              panelStyle={{ display: !addresses.length ? 'none' : 'inherit' }}
                              options={addresses}
                              className={classNames({
                                'w-full': true,
                              })}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('table.jobs.job_title')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Title"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Status}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('sts.label.bill.to')}:</div>
                        <Controller
                          name="BillTo"
                          control={control}
                          render={({ field }) => (
                            <Dropdown
                              disabled={(!isEdit && !isNew) || !customerValue}
                              {...field}
                              options={addresses}
                              panelStyle={{ display: !addresses.length ? 'none' : 'inherit' }}
                              className={classNames({
                                'w-full': true,
                              })}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.structure')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Structure"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.FormJob}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('sts.label.project.year')}:</div>
                        <Controller
                          name="ProjectYear"
                          control={control}
                          render={({ field, fieldState }) => (
                            <InputNumber
                              {...field}
                              value={field.value === '' ? null : field.value}
                              maxLength={4}
                              onChange={(e) => {
                                field.onChange(maxNumberLength(4, e.value));
                              }}
                              maxFractionDigits={0}
                              min={0}
                              format={false}
                              disabled={!isEdit && !isNew}
                              className={classNames({
                                'w-full': true,
                                'p-invalid': fieldState.invalid,
                              })}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('table.jobs.job_location')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Location"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Location}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('sts.label.job.hours')}:</div>
                        <Controller
                          name="Hours"
                          control={control}
                          render={({ field, fieldState }) => (
                            <InputNumber
                              {...field}
                              value={field.value === '' ? null : field.value}
                              maxFractionDigits={4}
                              onBlur={(e) => {
                                let newValue = e.target.value;
                                if (
                                  newValue &&
                                  newValue.toString().includes('.') &&
                                  newValue.toString().split('.')[1].length > 1
                                ) {
                                  newValue = Number(newValue.replace(/,/g, ''));
                                  newValue = Math.round(newValue * 10) / 10;
                                  field.onChange(newValue);
                                }
                              }}
                              min={0}
                              onChange={(e) => {
                                field.onChange(e.value);
                              }}
                              disabled={!isEdit && !isNew}
                              className={classNames({
                                'w-full': true,
                                'p-invalid': fieldState.invalid,
                              })}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('table.jobs.job_care_of')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="CareOf"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.CareOf}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('table.jobs.job_efficiency')}:</div>
                        <Controller
                          name="Efficiency"
                          control={control}
                          render={({ field, fieldState }) => (
                            <InputNumber
                              {...field}
                              value={field.value === '' ? null : field.value}
                              maxFractionDigits={10}
                              onBlur={(e) => {
                                let newValue = e.target.value;
                                if (
                                  newValue &&
                                  newValue.toString().includes('.') &&
                                  newValue.toString().split('.')[1].length > 2
                                ) {
                                  newValue = Number(newValue.replace(/,/g, ''));
                                  newValue = parseFloat(newValue.toFixed(2));
                                  field.onChange(newValue);
                                }
                              }}
                              onChange={(e) => {
                                field.onChange(e.value);
                              }}
                              disabled={!isEdit && !isNew}
                              className={classNames({
                                'w-full': true,
                                'p-invalid': fieldState.invalid,
                              })}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.po.number')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="PO"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.PO}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2">
                        <div className="w-15rem">{t('table.jobs.rf_interface')}:</div>
                        <Controller
                          name="RFInterface"
                          control={control}
                          render={({ field }) => {
                            return (
                              <Dropdown
                                {...field}
                                options={[
                                  {
                                    label: t('sts.status.noneTr'),
                                    value: t('sts.status.noneTr'),
                                  },
                                  {
                                    label: t('sts.dropdown.value.powerFab'),
                                    value: 'PowerFab',
                                  },
                                  {
                                    label: t('sts.dropdown.value.SDS2'),
                                    value: 'SDS/2',
                                  },
                                ]}
                                disabled={!isEdit && !isNew}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                })}
                              />
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 flex align-items-center w-12">
                    <div className="w-15rem">{t('sts.label.job.release.number')}:</div>
                    <div className="flex align-items-center w-full">
                      <Controller
                        name="Release"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            disabled={!isEdit && !isNew}
                            {...field}
                            className={classNames({
                              'w-5': true,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Release}
                          />
                        )}
                      />
                      <div className="flex align-items-center w-7 pl-2"></div>
                    </div>
                  </div>

                  <div className="flex align-items-center w-12 py-1">
                    <div className="w-7">
                      {t('sts.label.hardware.default.barcode.label.format')}:
                    </div>
                    <Controller
                      name="DefaultBarcodeLabelFormat"
                      control={control}
                      render={({ field, fieldState }) => (
                        <AutoComplete
                          disabled={!isEdit && !isNew}
                          dropdown
                          {...field}
                          virtualScrollerOptions={{
                            itemSize: DEFAULT_ROW_HEIGHT,
                          }}
                          itemTemplate={(value) => {
                            return (
                              <DropdownItemTooltip
                                id={`DefaultBarcodeLabelFormat_${generateIntegerId()}`}
                                label={value}
                              />
                            );
                          }}
                          panelStyle={{
                            display: !adhesiveBarCode.length ? 'none' : 'inherit',
                          }}
                          onFocus={(e) => {
                            if (!refDefaultBarcodeLabelFormat.current) {
                              refDefaultBarcodeLabelFormat.current = e.target.value;
                            }
                          }}
                          onSelect={(e) => {
                            field.onChange(e.value);
                            refDefaultBarcodeLabelFormat.current = null;
                          }}
                          onBlur={(e) => {
                            setTimeout(() => {
                              if (
                                jobInfo.DefaultBarcodeLabelFormat !== e.target.value &&
                                !adhesiveBarCode.find((el) => el === e.target.value)
                              ) {
                                field.onChange(refDefaultBarcodeLabelFormat.current);
                                refDefaultBarcodeLabelFormat.current = null;
                              }
                            }, 100);
                          }}
                          completeMethod={(e) => fetchAdhesiveBarCodeFrom(e.query)}
                          suggestions={adhesiveBarCode}
                          className={classNames({
                            'w-full': true,
                            'p-invalid': fieldState.invalid,
                          })}
                          inputStyle={{
                            background: fieldState.invalid ? 'var(--lightRed-500)' : '',
                          }}
                        />
                      )}
                    />
                  </div>

                  <div className="flex align-items-center w-12 py-1">
                    <div className="w-7">
                      {t('sts.label.hardware.default.barcode.labelase.format')}:
                    </div>
                    <Controller
                      name="DefaultLabelaseLabelFormat"
                      control={control}
                      render={({ field, fieldState }) => (
                        <AutoComplete
                          {...field}
                          dropdown
                          virtualScrollerOptions={{
                            itemSize: DEFAULT_ROW_HEIGHT,
                          }}
                          itemTemplate={(value) => {
                            return (
                              <DropdownItemTooltip
                                id={`DefaultBarcodeLabelFormat_${generateIntegerId()}`}
                                label={value}
                              />
                            );
                          }}
                          className={classNames({
                            'w-full': true,
                            'p-invalid': fieldState.invalid,
                          })}
                          onFocus={(e) => {
                            if (!refDefaultLabelaseLabelFormat.current) {
                              refDefaultLabelaseLabelFormat.current = e.target.value;
                            }
                          }}
                          onSelect={(e) => {
                            field.onChange(e.value);
                            refDefaultLabelaseLabelFormat.current = null;
                          }}
                          onBlur={(e) => {
                            setTimeout(() => {
                              if (
                                jobInfo.DefaultLabelaseLabelFormat !== e.target.value &&
                                !labelLaseBarCodeBarCode.find((el) => el === e.target.value)
                              ) {
                                field.onChange(refDefaultLabelaseLabelFormat.current);
                                refDefaultLabelaseLabelFormat.current = null;
                              }
                            }, 100);
                          }}
                          completeMethod={(e) => fetchLabelLaseBarCodeFrom(e.query)}
                          suggestions={labelLaseBarCodeBarCode}
                          inputStyle={{
                            background: fieldState.invalid ? 'var(--lightRed-500)' : '',
                          }}
                          panelStyle={{
                            display: !labelLaseBarCodeBarCode.length ? 'none' : 'inherit',
                          }}
                          disabled={!isEdit && !isNew}
                        />
                      )}
                    />
                  </div>

                  <div className="flex align-items-center">
                    <div>
                      <div className="my-1 flex flex-row gap-1">
                        <div className="w-20rem">
                          <div className="flex align-items-center">
                            <Controller
                              name="KeepMinors"
                              control={control}
                              render={({ field }) => (
                                <>
                                  <Checkbox
                                    disabled={!isEdit && !isNew}
                                    {...field}
                                    inputId="KeepMinors"
                                    checked={field.value}
                                  />
                                  <label htmlFor="KeepMinors" className="ml-2">
                                    {`${t('sts.label.keep.minors.on.import')} (${t(
                                      'sts.label.prefs',
                                    )}=${keepMinors ? t('sts.btn.yes') : t('sts.btn.no')})`}
                                  </label>
                                </>
                              )}
                            />
                          </div>
                        </div>
                        <div className="w-15rem">
                          <div className="flex flex-row">
                            <div className="flex align-items-center">
                              <Controller
                                name="ValidateHeats"
                                control={control}
                                render={({ field }) => (
                                  <>
                                    <Checkbox
                                      disabled={!isEdit && !isNew}
                                      {...field}
                                      inputId="ValidateHeats"
                                      checked={field.value}
                                    />
                                    <label htmlFor="ValidateHeats" className="ml-2">
                                      {t('sts.txt.heats.validate')}
                                    </label>
                                  </>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="my-1 flex flex-row gap-1">
                        <div className=" w-20rem">
                          <div className="flex align-items-center">
                            <Controller
                              name="ValidatePipes"
                              control={control}
                              render={({ field }) => (
                                <>
                                  <Checkbox
                                    disabled={(!isEdit && !isNew) || !watchHeats}
                                    {...field}
                                    inputId="ValidatePipes"
                                    checked={field.value}
                                  />
                                  <label htmlFor="ValidatePipes" className="ml-2">
                                    {t('sts.txt.pipes.validate')}
                                  </label>
                                </>
                              )}
                            />
                          </div>
                        </div>
                        <div className="w-15rem">
                          <div className="flex flex-row">
                            <div className="flex align-items-center">
                              <Controller
                                name="ValidateFittings"
                                control={control}
                                render={({ field }) => (
                                  <>
                                    <Checkbox
                                      disabled={(!isEdit && !isNew) || !watchHeats}
                                      {...field}
                                      inputId="ValidateFittings"
                                      checked={field.value}
                                    />
                                    <label htmlFor="ValidateFittings" className="ml-2">
                                      {t('table.jobs.validate_fittings')}
                                    </label>
                                  </>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button disabled label={t('sts.button.enterHeats')} size="small" />
                    </div>
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
            <Button label={t('sts.btn.cancel')} disabled={busy} size="small" onClick={cancel} />
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.delete')}
              severity="danger"
              disabled={!Delete}
              size="small"
              onClick={deleteJob}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
                setTimeout(checkInvalidFieldsFromApi);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            size="small"
            severity="secondary"
            onClick={() => {
              setIsEdit(true);
              setTimeout(checkInvalidFieldsFromApi);
            }}
            disabled={!activeActions || (!Edit && !Delete)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
