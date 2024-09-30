import React from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import moment from 'moment';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';

import { FORMS_CONFIG } from 'configs';

const LicenseValidationSchema = yup.object({
  LicenseeName: yup.string().trim().required(),
  LicenseKey: yup.string().trim().required(),
  SerialNumber: yup.string().trim().required(),
  ExpirationDate: yup.date().required(),
  SeatsTotal: yup.number().required().min(1).max(999999),
});

const NewLicense = ({ update, close }) => {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      LicenseeName: '',
      SerialNumber: '',
      LicenseKey: '',
      ExpirationDate: '',
      SeatsTotal: null,
    },
    resolver: yupResolver(LicenseValidationSchema),
  });

  return (
    <div id="license-management" className="fadein flex flex-column h-full pb-3">
      <div className="flex justify-content-between align-items-center">
        <h3>{t('sts.txt.license.entry')}</h3>
      </div>
      <div className="flex-auto">
        <form className="p-fluid" onSubmit={handleSubmit(update)}>
          <div className="my-1">
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.licensee.name.colon')}:</div>
              <Controller
                name="LicenseeName"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    className={classNames({
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={FORMS_CONFIG.FORM_LICENSE.fieldLength.LicenseeName}
                  />
                )}
              />
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.license.serial.number.colon')}:</div>
              <Controller
                name="SerialNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    className={classNames({
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={FORMS_CONFIG.FORM_LICENSE.fieldLength.SerialNumber}
                  />
                )}
              />
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.license.expiration.date.colon')}:</div>
              <Controller
                name="ExpirationDate"
                control={control}
                render={({ field, fieldState }) => (
                  <Calendar
                    {...field}
                    value={field.value ? new Date(field.value) : ''}
                    minDate={moment().subtract(1, 'day').toDate()}
                    placeholder="mm/dd/yyyy"
                    onChange={(e) => {
                      field.onChange(
                        e.value ? moment(e.value).format('YYYY-MM-DD') + 'T00:00:00Z' : '',
                      );
                    }}
                    dateFormat="mm/dd/yy"
                    showIcon
                    className={classNames({
                      'w-full': true,
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.license.key.colon')}:</div>
              <Controller
                name="LicenseKey"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    className={classNames({
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={FORMS_CONFIG.FORM_LICENSE.fieldLength.LicenseKey}
                  />
                )}
              />
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.license.seats.total.colon')}:</div>
              <Controller
                name="SeatsTotal"
                control={control}
                render={({ field, fieldState }) => (
                  <InputNumber
                    {...field}
                    value={field.value === '' ? null : field.value}
                    useGrouping={false}
                    onChange={(e) => field.onChange(e.value)}
                    className={classNames({
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
            </div>
          </div>
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              disabled={!isValid || !isDirty}
              label={t('sts.btn.save')}
              size="small"
              type="submit"
              onClick={handleSubmit(update)}
            />
            <Button label={t('sts.btn.close')} size="small" onClick={close} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLicense;
