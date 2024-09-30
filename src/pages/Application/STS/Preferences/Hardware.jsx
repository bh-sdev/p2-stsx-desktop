// import { useState } from 'react';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { classNames } from 'primereact/utils';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { RadioButton } from 'primereact/radiobutton';

import { preferencesHardwareBarcodeLabelTypesGet, preferencesHardwareLoadNumbersGet } from 'api';
import { GlobalContext } from 'pages/Application';
import { FORMS_CONFIG } from 'configs';

const Hardware = ({ ID, control, isEdit, data, getRefs, screenRefs }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      try {
        const loadNumbers = await preferencesHardwareLoadNumbersGet();
        const barcodeLabelTypes = await preferencesHardwareBarcodeLabelTypesGet();
        getRefs({ loadNumbers: loadNumbers.Entries, barcodeLabelTypes: barcodeLabelTypes.Entries });
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

  return (
    <div className="fadein">
      <div className="mw:w-full" style={{ width: '50rem' }}>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.hardware.line.1.barcode.label')}:
          </div>
          <Controller
            name={`${[ID]}.FirstLineOfIDBarcodeLabel`}
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                disabled={!isEdit}
                options={screenRefs?.barcodeLabelTypes?.map(({ ID, Name }) => ({
                  label: Name,
                  value: ID,
                }))}
                optionValue="value"
                className={classNames({ 'w-8': true, required: true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.hardware.line.2.barcode.label')}:
          </div>
          <Controller
            name={`${[ID]}.SecondLineOfIDBarcodeLabel`}
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                disabled={!isEdit}
                options={screenRefs?.barcodeLabelTypes?.map(({ ID, Name }) => ({
                  label: Name,
                  value: ID,
                }))}
                optionValue="value"
                className={classNames({ 'w-8': true, required: true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem shrink-0 text-right pr-4"></div>
          <div className="w-8">
            <h4 className="m-0 mb-2">{t('sts.label.hardware.load.calculation.auto')}</h4>
            <div className="pl-4">
              <Controller
                name={`${[ID]}.AutoLoadNumberCalc`}
                control={control}
                render={({ field }) =>
                  screenRefs?.loadNumbers?.map(({ Name, ID }) => (
                    <div key={ID.trim()} className="flex align-items-center mb-2">
                      <RadioButton
                        {...field}
                        disabled={!isEdit}
                        inputId={ID.trim()}
                        value={ID}
                        checked={field.value === ID}
                      />
                      <label htmlFor={ID.trim()} className="ml-2 cursor-pointer">
                        {Name}
                      </label>
                    </div>
                  ))
                }
              />
            </div>
          </div>
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.hardware.load.calculation.auto.starting.number')}:
          </div>
          <Controller
            name={`${[ID]}.AutoLoadStartingNumber`}
            control={control}
            render={({ field, fieldState }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                useGrouping={false}
                onChange={(e) => {
                  field.onChange(e.value === 0 ? null : e.value);
                }}
                maxLength={3}
                max={FORMS_CONFIG.FORM_HARDWARE.fieldLength.AutoLoadStartingNumber}
                className={classNames({
                  'w-8': true,
                  'p-invalid': fieldState.invalid,
                  required: data.AutoLoadNumberCalc !== 'None',
                })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem shrink-0 text-right pr-4"></div>
          <div className="w-8">
            <h4 className="m-0 mb-2">{t('sts.label.hardware.when.shipping.receiving')}</h4>
            <div className="pl-4">
              <Controller
                name={`${[ID]}.LoadNumEqualsRecvNum`}
                control={control}
                render={({ field }) => (
                  <div className="w-6 flex align-items-center mb-2">
                    <Checkbox
                      {...field}
                      disabled={!isEdit}
                      inputId="LoadNumEqualsRecvNum"
                      checked={field.value}
                    />
                    <label htmlFor="LoadNumEqualsRecvNum" className="ml-2 cursor-pointer">
                      {t('sts.label.hardware.load.eq.received')}
                    </label>
                  </div>
                )}
              />
              <Controller
                name={`${[ID]}.LoadNumEqualsShipLoadNum`}
                control={control}
                render={({ field }) => (
                  <div className="w-6 flex align-items-center">
                    <Checkbox
                      {...field}
                      disabled={!isEdit}
                      inputId="LoadNumEqualsShipLoadNum"
                      checked={field.value}
                    />
                    <label htmlFor="LoadNumEqualsShipLoadNum" className="ml-2 cursor-pointer">
                      {t('sts.label.hardware.load.eq.shipped')}
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.ActivateTransactionTracking`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="ActivateTransactionTracking"
                  checked={field.value}
                />
                <label htmlFor="ActivateTransactionTracking" className="ml-2 cursor-pointer">
                  {t('sts.label.hardware.activate.trans.tracking')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.CopyPreviousLoadInfo`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="CopyPreviousLoadInfo"
                  checked={field.value}
                />
                <label htmlFor="CopyPreviousLoadInfo" className="ml-2 cursor-pointer">
                  {t('sts.label.hardware.copy.previous.load.info')}
                </label>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Hardware;
