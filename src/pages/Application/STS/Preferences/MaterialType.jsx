import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { classNames } from 'primereact/utils';
// import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
// import { InputText } from 'primereact/inputtext';
// import { Dropdown } from 'primereact/dropdown';

import { preferencesMaterialTypeValidationTypes } from 'api';
import { GlobalContext } from 'pages/Application';

const MaterialType = ({ ID, control, isEdit, getRefs }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      try {
        const { Entries } = await preferencesMaterialTypeValidationTypes();
        getRefs({ validationTypes: Entries });
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
        {/* <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.ModuleInstalled`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="ModuleInstalled"
                  checked={field.value}
                />
                <label htmlFor="ModuleInstalled" className="ml-2 cursor-pointer">
                  {t('sts.txt.material.settings.type.module.installed')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.AutoNumberGeneration`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit && !data.MaterialInstalled}
                  inputId="AutoNumberGeneration"
                  checked={field.value}
                />
                <label htmlFor="AutoNumberGeneration" className="ml-2 cursor-pointer">
                  {t('sts.txt.material.settings.auto.material.number.generation')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">
            {t('sts.txt.material.settings.type.number.length')}:
          </div>
          <Controller
            name={`${[ID]}.MaterialTypeNumLen`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                disabled={!isEdit}
                useGrouping={false}
                min={9}
                max={40}
                onChange={debounce((e) => {
                  field.onChange(e.value === null ? '' : e.value);
                })}
                className={classNames({ 'w-full': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">
            {t('sts.txt.material.settings.part.number.pad.character')}:
          </div>
          <Controller
            name={`${[ID]}.PartNumPadCharacter`}
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={!isEdit && !data.AutoNumberGeneration && !data.ModuleInstalled}
                className={classNames({ 'w-full': true })}
                maxLength={1}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">
            {t('sts.label.material.settings.validate.material.type.against')}:
          </div>
          <Controller
            name={`${[ID]}.ValidateAgainst`}
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                disabled={!isEdit && !data.AutoNumberGeneration && !data.ModuleInstalled}
                options={screenRefs?.validationTypes?.map(({ ID, Name }) => ({
                  label: Name,
                  value: ID,
                }))}
                optionValue="value"
                className={classNames({ 'w-full': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">
            {t('sts.label.material.settings.wt.each.uom.code')}:
          </div>
          <Controller
            name={`${[ID]}.ValidateAgainst`}
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                disabled={!isEdit}
                options={screenRefs?.validationTypes?.map(({ ID, Name }) => ({
                  label: Name,
                  value: ID,
                }))}
                optionValue="value"
                className={classNames({ 'w-full': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">
            {t('sts.label.material.settings.max.drop.length.to.scrap')}:
          </div>
          <Controller
            name={`${[ID]}.MaxDropLenGoingToScrap`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                disabled={!isEdit && !data.ModuleInstalled}
                maxFractionDigits={3}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-full': true })}
              />
            )}
          />
        </div> */}
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4">{t('sts.txt.material.raw.barcode.length')}:</div>
          <Controller
            name={`${[ID]}.RawMaterialSerialNumLen`}
            control={control}
            render={({ field, fieldState }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                useGrouping={false}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue < 9 || numValue > 40) {
                    field.onChange(10);
                  } else {
                    field.onChange(numValue);
                  }
                }}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-full required': true, 'p-invalid': fieldState.invalid })}
              />
            )}
          />
        </div>
        {/* <div className="flex align-items-center mb-2 w-full">
          <div className="w-8 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.ValidatePiecemark`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit && !data.ModuleInstalled}
                  inputId="ValidatePiecemark"
                  checked={field.value}
                />
                <label htmlFor="ValidatePiecemark" className="ml-2 cursor-pointer">
                  {t('sts.label.material.settings.validation.processes.windows')}
                </label>
              </div>
            )}
          />
        </div> */}
      </div>
    </div>
  );
};

export default MaterialType;
