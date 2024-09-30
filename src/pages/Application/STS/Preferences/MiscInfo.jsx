import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { classNames } from 'primereact/utils';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { Dropdown } from 'primereact/dropdown';

import {
  preferencesMiscInfoCustomerNumbersGet,
  preferencesMiscInfoInstalledAtTypesGet,
  preferencesMiscInfoRoutingCodesGet,
} from 'api';
import { GlobalContext } from 'pages/Application';
import { DEFAULT_ROW_HEIGHT } from 'const';

const MiscInfo = ({ ID, control, isEdit, setValue, data, getRefs, screenRefs }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);
  const [customerNumberSuggestions, setCustomerNumberSuggestions] = useState([]);
  const [routingCodeSuggestions, setRoutingCodeSuggestions] = useState([]);

  const refRoutingCodeName = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { Entries } = await preferencesMiscInfoInstalledAtTypesGet();
        getRefs({ installedAtTypes: Entries });
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

  const matchCustomerNumber = async (prefix) => {
    try {
      const { Entries } = await preferencesMiscInfoCustomerNumbersGet({ prefix });
      setCustomerNumberSuggestions(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const matchRoutingCode = async (prefix) => {
    try {
      const { Entries } = await preferencesMiscInfoRoutingCodesGet({ prefix });
      setRoutingCodeSuggestions(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  return (
    <div className="fadein">
      <div className="mw:w-full" style={{ width: '50rem' }}>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.misc.truck.max.weight.default')}:
          </div>
          <Controller
            name={`${[ID]}.DefaultTruckMaxWeightKg`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                maxFractionDigits={3}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-8': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.txt.misc.mark.and.unique.zip.file.name')}:
          </div>
          <Controller
            name={`${[ID]}.MarkUniqueZipFileName`}
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={!isEdit || data.UseJobNumberForMarkUniqueZip}
                className={classNames({ 'w-8': true })}
                onChange={(e) => {
                  if (/[\\:*?"<>|]/.test(e.target.value)) {
                    return;
                  }
                  field.onChange(e.target.value);
                }}
                onBlur={(e) => {
                  if (!data.UseJobNumberForMarkUniqueZip && !e.target.value) {
                    field.onChange('MARKUNIQIE');
                    return;
                  }
                  field.onChange(e.target.value.trim());
                }}
                maxLength={260}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.UseJobNumberForMarkUniqueZip`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="UseJobNumberForMarkUniqueZip"
                  checked={field.value}
                />
                <label htmlFor="UseJobNumberForMarkUniqueZip" className="ml-2 cursor-pointer">
                  {t('sts.label.misc.use.job.number.for.m.u.zip')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.misc.reciever.zip.file.name')}:
          </div>
          <Controller
            name={`${[ID]}.ReceiverZipFileName`}
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={!isEdit || data.UseJobNumberForReceiverZip}
                className={classNames({ 'w-8': true })}
                onBlur={(e) => {
                  if (!data.UseJobNumberForReceiverZip && !e.target.value) {
                    field.onChange('RECEIVER');
                    return;
                  }
                  field.onChange(e.target.value.trim());
                }}
                onChange={(e) => {
                  if (/[\\:*?"<>|]/.test(e.target.value)) {
                    return;
                  }
                  field.onChange(e.target.value);
                }}
                maxLength={260}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.UseJobNumberForReceiverZip`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="UseJobNumberForReceiverZip"
                  checked={field.value}
                />
                <label htmlFor="UseJobNumberForReceiverZip" className="ml-2 cursor-pointer">
                  {t('sts.label.misc.use.job.number.for.receiver.zip')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.CategoryCodesPOSpecific`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="CategoryCodesPOSpecific"
                  checked={field.value}
                />
                <label htmlFor="CategoryCodesPOSpecific" className="ml-2 cursor-pointer">
                  {t('sts.label.misc.category.codes.po.specific')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.misc.multiple.id.prompt.quantity')}:
          </div>
          <Controller
            name={`${[ID]}.MultipleIDPromptQuantityGreater`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                maxFractionDigits={3}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-8': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">
            {t('sts.label.misc.multiple.id.prompt.weight')}:
          </div>
          <Controller
            name={`${[ID]}.MultipleIDPromptWeightLess`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                maxFractionDigits={3}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-8': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">{t('sts.label.misc.default.routing.code')}:</div>
          <Controller
            name={`${[ID]}.DefaultRoutingCodeName`}
            control={control}
            render={({ field }) => (
              <AutoComplete
                {...field}
                disabled={!isEdit}
                virtualScrollerOptions={{
                  itemSize: DEFAULT_ROW_HEIGHT,
                }}
                itemTemplate={(value, index) => (
                  <DropdownItemTooltip id={`Code_${index}`} label={value.Name} />
                )}
                dropdown
                onFocus={(e) => {
                  if (!refRoutingCodeName.current) {
                    refRoutingCodeName.current = e.target.value;
                  }
                }}
                onSelect={(e) => {
                  field.onChange(e.value?.Name);
                  setValue(`${[ID]}.DefaultRoutingCodeID`, e.value?.ID);
                  refRoutingCodeName.current = e.value?.Name;
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    field.onChange(null);
                    setValue(`${[ID]}.DefaultRoutingCodeID`, null);
                    return;
                  }
                  setTimeout(() => {
                    const MATCH = routingCodeSuggestions.find(
                      ({ Name }) => Name === e.target.value,
                    );
                    if (!MATCH) {
                      field.onChange(refRoutingCodeName.current);
                    }
                  }, 100);
                }}
                autoHighlight
                completeMethod={(e) => matchRoutingCode(e.query)}
                suggestions={routingCodeSuggestions}
                className={classNames({
                  'w-8': true,
                })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.Metric`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox {...field} disabled={!isEdit} inputId="Metric" checked={field.value} />
                <label htmlFor="Metric" className="ml-2 cursor-pointer">
                  {t('sts.txt.misc.measurement.system.metric')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4"></div>
          <Controller
            name={`${[ID]}.KeepMinorPiecemarksUponImport`}
            control={control}
            render={({ field }) => (
              <div className="w-6 flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="KeepMinorPiecemarksUponImport"
                  checked={field.value}
                />
                <label htmlFor="KeepMinorPiecemarksUponImport" className="ml-2 cursor-pointer">
                  {t('sts.txt.misc.keep.minor.marks.during.import')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">{t('sts.txt.misc.barcode.length')}:</div>
          <Controller
            name={`${[ID]}.BarcodeLength`}
            control={control}
            render={({ field, fieldState }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                useGrouping={false}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue < 10 || numValue > 30) {
                    field.onChange(10);
                  } else {
                    field.onChange(numValue);
                  }
                }}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({
                  'w-8': true,
                  required: true,
                  'p-invalid': fieldState.invalid,
                })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">{t('sts.txt.misc.idle.time.max')}:</div>
          <Controller
            name={`${[ID]}.MaximumLoginIdleTimeMin`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value === '' ? null : field.value}
                disabled={!isEdit}
                onChange={(e) => {
                  field.onChange(e.value === null ? '' : e.value);
                }}
                className={classNames({ 'w-8': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">{t('sts.label.misc.sts.installed.at')}:</div>
          <Controller
            name={`${[ID]}.InstalledAt`}
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                disabled={!isEdit}
                options={screenRefs?.installedAtTypes?.map(({ ID, Name }) => ({
                  label: Name,
                  value: ID,
                }))}
                optionValue="value"
                className={classNames({ 'w-8': true })}
              />
            )}
          />
        </div>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-16rem text-right pr-4">{t('sts.label.misc.your.customer.number')}:</div>
          <Controller
            name={`${[ID]}.YourCustomerNum`}
            control={control}
            render={({ field }) => (
              <AutoComplete
                {...field}
                disabled={!isEdit}
                virtualScrollerOptions={{
                  itemSize: DEFAULT_ROW_HEIGHT,
                }}
                itemTemplate={(value, index) => (
                  <DropdownItemTooltip id={`CustomerNumber_${index}`} label={value.Name} />
                )}
                dropdown
                onChange={(e) => {
                  field.onChange(e.value?.Name || e.value);
                }}
                autoHighlight
                completeMethod={(e) => matchCustomerNumber(e.query)}
                suggestions={customerNumberSuggestions}
                className={classNames({
                  'w-8': true,
                })}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default MiscInfo;
