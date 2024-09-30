import React, { useContext, useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { Calendar } from 'primereact/calendar';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FORMS_CONFIG } from 'configs';
import { trimStartEnd } from 'utils';
import { GlobalContext } from '../../index';
import { getJobNumber } from 'api/api.logs';

import useWindowControl from 'hooks/useWindowControl';
import ROUTER_PATH from 'const/router.path';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import moment from 'moment';
import { DEFAULT_ROW_HEIGHT } from 'const';

const FiltersValidationSchema = yup.object({
  StartTransDate: yup
    .date()
    .nullable()
    .test('is-before-end', '', function (value) {
      const { EndTransDate } = this.parent;
      return !value || !EndTransDate || new Date(value) <= new Date(EndTransDate);
    }),
  EndTransDate: yup
    .date()
    .nullable()
    .test('is-after-start', '', function (value) {
      const { StartTransDate } = this.parent;
      return !value || !StartTransDate || new Date(value) >= new Date(StartTransDate);
    }),
});
const Filters = () => {
  const { refToast } = useContext(GlobalContext);
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const { sendPost, receivedData } = useWindowControl(ROUTER_PATH.viewLogFilters);
  const selectedJobRef = useRef({});
  const { t } = useTranslation();
  const {
    control,
    watch,
    trigger,
    reset,
    formState: { errors },
    setValue,
    handleSubmit,
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(FiltersValidationSchema),
  });

  const watchFields = watch([
    'JobNumber',
    'RfCommData',
    'StartTransDate',
    'LoadNumber',
    'RFClient',
    'RfProgram',
    'StatusCode',
    'Division',
    'EndTransDate',
    'IPAddress',
    'EntryResponse',
    'SignonEmployee',
    'StatusLocation',
    'Worker',
  ]);

  const isAnyFieldFilled = watchFields.some((field) => field);

  useEffect(() => {
    if (receivedData) {
      Object.entries(receivedData).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
  }, [receivedData]);

  useEffect(() => {
    sendPost({ customData: { ready: true } });
  }, []);

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await getJobNumber({ include_closed: true, prefix: prefix });
      setNumberSuggestions(Entries.map((data) => ({ label: data.Number, value: data })));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const jobNumberFieldFlow = (data) => {
    if (!data) return (selectedJobRef.current = {});
    const MATCHED = numberSuggestions.find(({ label }) => label === (data.label || data));
    if (MATCHED) {
      selectedJobRef.current = MATCHED.value;
      setValue('JobNumber', MATCHED.value.Number);
    } else {
      confirmDialog({
        closable: false,
        message: t('1217'),
        header: t('1217'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          selectedJobRef.current = {};
          setValue('JobNumber', '');
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const applyFilters = (data) => {
    sendPost({
      customData: {
        ...data,
        CustomerNumber: selectedJobRef.current.CustomerNumber,
        CustomerName: selectedJobRef.current.CustomerName,
        JobTitle: selectedJobRef.current.Title,
        ...(data.StartTransDate && {
          StartTransDate: moment(data.StartTransDate).format(),
        }),
        ...(data.EndTransDate && {
          EndTransDate: moment(data.EndTransDate).add(1, 'days').format(),
        }),
      },
    });
  };
  const handleReset = () => {
    reset({
      CustomerNumber: '',
      CustomerName: '',
      JobNumber: '',
      JobTitle: '',
      RfCommData: '',
      LoadNumber: '',
      RFClient: '',
      RfProgram: '',
      StartEditDate: '',
      StatusCode: '',
      Division: '',
      IPAddress: '',
      EntryResponse: '',
      SignonEmployee: '',
      StatusLocation: '',
      Worker: '',
    });
    selectedJobRef.current = {};
  };

  return (
    <div className="p-2 flex justify-content-between flex-column h-full">
      <div>
        <div className="fadein" style={{ width: '63rem', maxWidth: '100%' }}>
          <div className="flex align-items-center mb-1">
            <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.job.number')}:</div>
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
                          jobNumberFieldFlow(trimStartEnd(e.target.value.toUpperCase()), field);
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
                      'w-12 md:w-30rem': true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Number}
                  />
                );
              }}
            />
          </div>
          <div className="flex align-items-center mb-1">
            <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.job.title')}:</div>
            <Controller
              name="JobTitle"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id={field.name}
                  disabled
                  {...field}
                  value={selectedJobRef.current.Title || field.value || ''}
                  className={classNames({
                    'w-12 md:w-30rem': true,
                    'p-invalid': fieldState.invalid,
                  })}
                  maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.ThirdPartyLogin}
                />
              )}
            />
          </div>
          <div className="flex align-items-center mb-1">
            <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.customer.number')}:</div>
            <Controller
              name="CustomerNumber"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  disabled={true}
                  id={field.name}
                  {...field}
                  value={selectedJobRef.current.CustomerNumber || field.value || ''}
                  className={classNames({
                    'p-invalid': fieldState.invalid,
                    'w-12 md:w-30rem': true,
                  })}
                />
              )}
            />
          </div>
          <div className="flex align-items-center mb-1">
            <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.customer.name')}:</div>
            <Controller
              name="CustomerName"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  disabled
                  id={field.name}
                  {...field}
                  value={selectedJobRef.current.CustomerName || field.value || ''}
                  className={classNames({
                    'w-12 md:w-30rem': true,
                    'p-invalid': fieldState.invalid,
                  })}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap" style={{ width: '63rem', maxWidth: '100%' }}>
          <div className="my-1 w-12 md:w-30rem">
            <div className="flex align-items-center">
              <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.rf.comm.data')}:</div>
              <Controller
                name="RfCommData"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    id={field.name}
                    {...field}
                    onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                    onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                    className={classNames({
                      'w-full': true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={100}
                  />
                )}
              />
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">
                  {t('sts.label.start.transaction.date')}:
                </div>
                <Controller
                  name="StartTransDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Calendar
                      {...field}
                      value={field.value ? new Date(field.value) : ''}
                      dateFormat="mm/dd/yy"
                      placeholder="mm/dd/yyyy"
                      onChange={(date) => {
                        trigger('EndTransDate');
                        field.onChange(date);
                      }}
                      showIcon
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
                <div className="mr-4 w-10rem flex-shrink-0">{t('sts.load.num')}:</div>
                <Controller
                  name="LoadNumber"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={20}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">
                  {t('table.rf_transactions.rf_client')}:
                </div>
                <Controller
                  name="RFClient"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={50}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.rf.program')}:</div>
                <Controller
                  name="RfProgram"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={20}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">{t('table.general.status_code')}:</div>
                <Controller
                  name="StatusCode"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={15}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="md:pl-4 w-12 md:w-30rem">
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0 shrink-0">
                  {t('table.general.division')}:
                </div>
                <Controller
                  name="Division"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={50}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0 shrink-0">
                  {t('sts.label.end.transaction.date')}:
                </div>
                <Controller
                  name="EndTransDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Calendar
                      {...field}
                      value={field.value ? new Date(field.value) : ''}
                      dateFormat="mm/dd/yy"
                      placeholder="mm/dd/yyyy"
                      onChange={(date) => {
                        trigger('StartTransDate');
                        field.onChange(date.target.value);
                      }}
                      showIcon
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
                <div className="mr-4 w-10rem flex-shrink-0 shrink-0">
                  {t('sts.label.ip.address')}:
                </div>

                <Controller
                  name="IPAddress"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={45}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0 shrink-0">
                  {t('sts.label.entry.response')}:
                </div>

                <Controller
                  name="EntryResponse"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={30}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0 shrink-0">
                  {t('table.general.user.name')}:
                </div>
                <Controller
                  name="SignonEmployee"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={10}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.status.location')}:</div>

                <Controller
                  name="StatusLocation"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={15}
                    />
                  )}
                />
              </div>
            </div>
            <div className="my-1">
              <div className="flex align-items-center">
                <div className="mr-4 w-10rem flex-shrink-0">{t('sts.label.worker')}:</div>

                <Controller
                  name="Worker"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(event) => field.onChange(event.target.value?.toUpperCase())}
                      onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={10}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex align-items-end justify-content-end gap-2">
        <Button
          label={t('sts.btn.apply')}
          size="small"
          disabled={errors.StartTransDate || errors.EndTransDate}
          onClick={handleSubmit(applyFilters)}
        />
        <Button
          severity="secondary"
          disabled={!isAnyFieldFilled}
          label={t('sts.btn.clear')}
          size="small"
          onClick={() => handleReset()}
        />
        <Button label={t('sts.btn.close')} size="small" onClick={() => window.close()} />
      </div>
    </div>
  );
};
export default Filters;
