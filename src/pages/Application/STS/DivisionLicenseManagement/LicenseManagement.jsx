import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Calendar } from 'primereact/calendar';

import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { licenseCheck, licenseUpdate, licenseGetInfo } from 'api';
import { FORMS_CONFIG } from 'configs';
import moment from 'moment';
import { InputNumber } from 'primereact/inputnumber';
import useWindowControl from 'hooks/useWindowControl';
import ROUTER_PATH from 'const/router.path';

const LicenseValidationSchema = yup.object({
  LicenseeName: yup.string().trim().required(),
  LicenseKey: yup.string().trim().required(),
  SerialNumber: yup.string().trim().required(),
  ExpirationDate: yup.date().required(),
  SeatsTotal: yup.number().required().min(1).max(999999),
});

const LicensesManagement = () => {
  const { sendPost } = useWindowControl(ROUTER_PATH.licenseManagement);
  const { t } = useTranslation();
  const [data, setData] = useState({});
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    defaultValues: async () => {
      try {
        const res = await licenseGetInfo();
        setData(res);
        return {
          LicenseeName: res.LicenseeName,
          SerialNumber: res.SerialNumber,
          LicenseKey: res.LicenseKey,
          ExpirationDate: res.ExpirationDate,
          SeatsTotal: res.SeatsTotal,
        };
      } catch (e) {
        confirmDialog({
          closable: false,
          header: e.data.response.Message,
          message: e.data.response.Detail,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    },
    resolver: yupResolver(LicenseValidationSchema),
  });

  const authorize = async (data) => {
    setBusy(true);
    try {
      const res = await licenseCheck(data);
      if (res.IsFraud) {
        confirmDialog({
          closable: false,
          message: t('sts.txt.license.invalid'),
          header: t('sts.txt.notice'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
        return;
      }
      reset({
        LicenseeName: res.LicenseeName,
        SerialNumber: res.SerialNumber,
        LicenseKey: res.LicenseKey,
        ExpirationDate: res.ExpirationDate,
        SeatsTotal: res.SeatsTotal,
      });
      setAuthorized(true);
      confirmDialog({
        closable: false,
        message: t('sts.txt.license.authorized'),
        header: t('sts.txt.notice'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
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
    } finally {
      setBusy(false);
    }
  };

  const update = async (data) => {
    setBusy(true);
    try {
      const res = await licenseUpdate(data);
      if (res.IsFraud) {
        confirmDialog({
          closable: false,
          message: t('sts.txt.license.invalid'),
          header: t('sts.txt.notice'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
        return;
      }
      setData(res);
      reset({
        LicenseeName: res.LicenseeName,
        SerialNumber: res.SerialNumber,
        LicenseKey: res.LicenseKey,
        ExpirationDate: res.ExpirationDate,
        SeatsTotal: res.SeatsTotal,
      });
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.license.updated'),
        header: t('sts.txt.notice'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
      sendPost({ changed: true });
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
      setBusy(false);
    }
  };

  return (
    <div id="license-management" className="fadein flex flex-column h-full p-3">
      <div className="flex justify-content-between align-items-center">
        <h3>{t('sts.txt.license.entry')}</h3>
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <form className="p-fluid">
          <div className="my-1">
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.company.name')}:</div>
              <div className="w-full">{data.CorpName}</div>
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-7">{t('sts.label.licensee.name.colon')}:</div>
              <Controller
                name="LicenseeName"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    disabled={!isEdit}
                    id={field.name}
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
                    disabled={!isEdit}
                    id={field.name}
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
                    //TODO: need investigate how to set defaultValue correctly!
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
                    disabled={!isEdit}
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
                    disabled={!isEdit}
                    id={field.name}
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
                    disabled={!isEdit}
                    id={field.name}
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
        </form>
      </div>
      <div className="flex justify-content-end gap-2">
        {isEdit ? (
          <>
            <Button
              disabled={authorized ? !isValid || !isDirty : !isValid || !isDirty || authorized}
              loading={busy}
              label={t('sts.btn.authorize')}
              size="small"
              onClick={handleSubmit(authorize)}
            />
            <Button
              disabled={!authorized || isDirty}
              loading={busy}
              label={t('sts.btn.save')}
              size="small"
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
                reset(data);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
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

export default LicensesManagement;
