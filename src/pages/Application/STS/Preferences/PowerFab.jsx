import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

import { preferencesFabSuiteTestConnection } from 'api';
import { trimAll } from 'utils';
import { FORMS_CONFIG } from 'configs';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputNumber } from 'primereact/inputnumber';

const PowerFab = ({ ID, isEdit, control, data, setValue }) => {
  const { t } = useTranslation();

  const [testing, setTesting] = useState(false);

  const disabled = !data?.FabSuiteInstallation || !isEdit;

  const remoteServerDisabled = !data?.FabSuiteUseRemoteServer || !isEdit;

  const testConnection = async () => {
    setTesting(true);
    try {
      const {
        FabSuiteServerName: Server,
        FabSuiteDatabase: Port,
        FabSuiteUserID: User,
        FabSuitePassword: Pass,
      } = data;
      const res = await preferencesFabSuiteTestConnection({
        Port: Number(Port),
        Server,
        User,
        Pass,
      });
      confirmDialog({
        closable: false,
        message: `${t('1214')} ${res.Reply}`,
        header: 1214,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: t(e.response.data.Message),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fadein">
      <div className="mw:w-full" style={{ width: '50rem' }}>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <div className="flex w-full">
            <Controller
              name={`${[ID]}.FabSuiteInstallation`}
              control={control}
              render={({ field }) => (
                <div className="w-full flex align-items-center w-6">
                  <Checkbox
                    {...field}
                    onChange={(e) => {
                      if (e.checked) {
                        setValue(`${[ID]}.ImportsOnly`, false);
                      }
                      field.onChange(e.checked);
                    }}
                    disabled={!isEdit}
                    inputId="FabSuiteInstallation"
                    checked={field.value}
                  />
                  <label htmlFor="FabSuiteInstallation" className="ml-2 cursor-pointer">
                    {t('sts.txt.applications.fs.installation')}
                  </label>
                </div>
              )}
            />
            <Controller
              name={`${[ID]}.ImportsOnly`}
              control={control}
              render={({ field }) => (
                <div className="w-full flex align-items-center w-6">
                  <Checkbox
                    {...field}
                    onChange={(e) => {
                      if (e.checked) {
                        setValue(`${[ID]}.FabSuiteInstallation`, false);
                      }
                      field.onChange(e.checked);
                    }}
                    disabled={disabled}
                    inputId="ImportsOnly"
                    checked={field.value}
                  />
                  <label htmlFor="ImportsOnly" className="ml-2 cursor-pointer">
                    {t('sts.txt.applications.ft.use.settings.for.imports.only')}
                  </label>
                </div>
              )}
            />
          </div>
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.PassWorkerId`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="PassWorkerId"
                  checked={field.value}
                />
                <label htmlFor="PassWorkerId" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.pass.worker.emp.number.to.fs')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <div className="w-full text-right">
            <Button
              loading={testing}
              disabled={
                !data?.FabSuiteServerName ||
                !data?.FabSuiteDatabase ||
                !data?.FabSuiteUserID ||
                !data?.FabSuitePassword ||
                !data?.FabSuiteInstallation ||
                !isEdit
              }
              label={t('sts.btn.check.connection')}
              size="small"
              onClick={testConnection}
            />
          </div>
        </div>
        <div className="flex mb-2 align-items-center w-full">
          <div className="w-3 text-right pr-4">{t('sts.label.applications.fs.server.ip')}:</div>
          <Controller
            name={`${[ID]}.FabSuiteServerName`}
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={disabled}
                className={classNames({ 'w-5': true, required: data.FabSuiteInstallation })}
                maxLength={FORMS_CONFIG.FORM_POWER_FAB.fieldLength.FabSuiteServerName}
              />
            )}
          />
          <div className="flex align-items-center w-7 pl-4">
            <div className="w-4 text-right pr-4">{t('sts.label.applications.fs.port.number')}:</div>
            <Controller
              name={`${[ID]}.FabSuiteDatabase`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value === '' ? null : field.value}
                  useGrouping={false}
                  disabled={disabled}
                  onChange={(e) => {
                    field.onChange(e.value === null ? '' : e.value);
                  }}
                  className={classNames({ 'w-full': true, required: data.FabSuiteInstallation })}
                  maxLength={FORMS_CONFIG.FORM_POWER_FAB.fieldLength.FabSuiteServerPort}
                  max={FORMS_CONFIG.FORM_POWER_FAB.maxFieldValue.FabSuiteServerPort}
                />
              )}
            />
          </div>
        </div>
        <div className="flex mb-2 align-items-center w-full">
          <div className="w-3 text-right pr-4">{t('sts.label.applications.fs.user.id')}:</div>
          <Controller
            name={`${[ID]}.FabSuiteUserID`}
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={disabled}
                checked={field.value}
                className={classNames({ 'w-5': true, required: data.FabSuiteInstallation })}
              />
            )}
          />
          <div className="flex align-items-center w-7 pl-4">
            <div className="w-4 text-right pr-4">{t('sts.label.applications.fs.password')}:</div>
            <Controller
              name={`${[ID]}.FabSuitePassword`}
              control={control}
              render={({ field, fieldState }) => (
                <Password
                  {...field}
                  disabled={disabled}
                  toggleMask={isEdit}
                  feedback={false}
                  onChange={(e) => {
                    field.onChange(trimAll(e.target.value));
                  }}
                  className={classNames({
                    'w-full': true,
                    required: data.FabSuiteInstallation,
                    'p-invalid': fieldState.invalid,
                  })}
                  inputClassName="w-full"
                />
              )}
            />
          </div>
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.LocFieldDataRepBatchIdInfo`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="LocFieldDataRepBatchIdInfo"
                  checked={field.value}
                />
                <label htmlFor="LocFieldDataRepBatchIdInfo" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.location.field.data.reps.batch.id.info')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.AllowAuditScans`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="AllowAuditScans"
                  checked={field.value}
                />
                <label htmlFor="AllowAuditScans" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.allow.audit.scans.of.serials.not.in.fs.or.sts')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.PrintIdFromCutList`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="PrintIdFromCutList"
                  checked={field.value}
                />
                <label htmlFor="PrintIdFromCutList" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.print.labels.from.cut.list')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.FlipPrimarySecondaryLocsWhenShop`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  onChange={(e) => {
                    if (!e.checked) {
                      setValue(`${[ID]}.DoNotPushSecLocToFS`, false);
                    }
                    field.onChange(e.checked);
                  }}
                  disabled={disabled}
                  inputId="FlipPrimarySecondaryLocsWhenShop"
                  checked={field.value}
                />
                <label htmlFor="FlipPrimarySecondaryLocsWhenShop" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.flip.primary.secondary.locations')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.DoNotPushSecLocToFS`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center pl-4">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="DoNotPushSecLocToFS"
                  checked={field.value}
                />
                <label htmlFor="DoNotPushSecLocToFS" className="ml-2 cursor-pointer">
                  {t('sts.chk.do.not.push.location2')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.DoNotPrintScrapLabels`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="DoNotPrintScrapLabels"
                  checked={field.value}
                />
                <label htmlFor="DoNotPrintScrapLabels" className="ml-2 cursor-pointer">
                  {t('sts.txt.applications.fs.do.not.print.scrap.label')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-3 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.DoNotPassTheIdNumber`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  inputId="DoNotPassTheIdNumber"
                  checked={field.value}
                />
                <label htmlFor="DoNotPassTheIdNumber" className="ml-2 cursor-pointer">
                  {t(
                    'sts.txt.applications.fs.do.not.pass.the.id.number.in.the.cut.cutlist.raw.operation',
                  )}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 align-items-center w-full">
          <div className="w-3 text-right pr-4"></div>
          <div className="w-6">
            <h4 className="my-2">Checklist Receive</h4>
            <div className="pl-4">
              <Controller
                name={`${[ID]}.SetFinalizeToYes`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center mb-2">
                    <Checkbox
                      {...field}
                      disabled={disabled}
                      inputId="SetFinalizeToYes"
                      checked={field.value}
                    />
                    <label htmlFor="SetFinalizeToYes" className="ml-2 cursor-pointer">
                      {t('sts.txt.set.finalize.all')}
                    </label>
                  </div>
                )}
              />
              <Controller
                name={`${[ID]}.SetBundledToYes`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center">
                    <Checkbox
                      {...field}
                      disabled={disabled}
                      inputId="SetBundledToYes"
                      checked={field.value}
                    />
                    <label htmlFor="SetBundledToYes" className="ml-2 cursor-pointer">
                      {t('sts.txt.set.bundle.all')}
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
          <div className="w-6 pl-4">
            <h4 className="my-2">Timed Transactions</h4>
            <div className="pl-4">
              <Controller
                name={`${[ID]}.MultiplyByQuantity`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center mb-2">
                    <Checkbox
                      {...field}
                      disabled={disabled}
                      inputId="MultiplyByQuantity"
                      checked={field.value}
                    />
                    <label htmlFor="MultiplyByQuantity" className="ml-2 cursor-pointer">
                      {t('sts.txt.multiply.by.qnt')}
                    </label>
                  </div>
                )}
              />
              <Controller
                name={`${[ID]}.MultiplyByWorkers`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center">
                    <Checkbox
                      {...field}
                      disabled={disabled}
                      inputId="MultiplyByWorkers"
                      checked={field.value}
                    />
                    <label htmlFor="MultiplyByWorkers" className="ml-2 cursor-pointer">
                      {t('sts.txt.multiply.by.wkrs')}
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap mb-2 align-items-center w-full pt-2">
          <div className="w-2 text-right pr-4"></div>
          <div className="w-9">
            <Controller
              name={`${[ID]}.FabSuiteUseRemoteServer`}
              control={control}
              render={({ field }) => (
                <div className="w-full flex align-items-center w-6">
                  <Checkbox
                    {...field}
                    onChange={(e) => {
                      // console.log("CHANGED: ", e);
                      field.onChange(e.checked);
                    }}
                    disabled={!isEdit}
                    inputId="FabSuiteUseRemoteServer"
                    checked={field.value}
                  />
                  <label htmlFor="FabSuiteUseRemoteServer" className="ml-2 cursor-pointer">
                    {t('sts.txt.applications.fs.use_remote_server')}
                  </label>
                </div>
              )}
            />
          </div>
          {/* <div className="w-full" /> */}
          <div className="w-2 text-right pr-0"></div>
          <div className="w-4 flex pt-2">
            <div className="w-4 text-right pt-1 pr-2">
              {t('sts.txt.applications.fs.remote_server_port')}#:
            </div>
            <div className="w-8 text-right pr-0">
              <Controller
                name={`${[ID]}.FabSuiteRemoteServerPort`}
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value === '' ? null : field.value}
                    useGrouping={false}
                    disabled={disabled || remoteServerDisabled}
                    onChange={(e) => {
                      field.onChange(e.value === null ? '' : e.value);
                    }}
                    className={classNames({
                      'w-full': true,
                      required: !remoteServerDisabled,
                    })}
                    maxLength={FORMS_CONFIG.FORM_POWER_FAB.fieldLength.FabSuiteServerPort}
                    max={FORMS_CONFIG.FORM_POWER_FAB.maxFieldValue.FabSuiteServerPort}
                  />
                )}
              />
              {/* {JSON.stringify({ d: data.FabSuiteUseRemoteServer })} */}
              {/* {JSON.stringify({ remoteServerDisabled })} */}
            </div>
          </div>
          {/*  */}
        </div>
      </div>
    </div>
  );
};

export default PowerFab;
