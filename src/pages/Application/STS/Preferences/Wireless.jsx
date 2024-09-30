import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';
import { InputNumber } from 'primereact/inputnumber';

import { maxNumberLength } from 'utils';

const Wireless = ({ ID, isEdit, control, setValue }) => {
  const { t } = useTranslation();

  return (
    <div className="fadein">
      <div className="mw:w-full" style={{ width: '50rem' }}>
        <div className="flex align-items-center mb-2 w-full">
          <div className="w-5 text-right pr-4">
            {t('sts.label.rfsettings.welder.group.range.qty')}:
          </div>
          <div className="flex align-items-center w-full">
            <Controller
              name={`${[ID]}.WelderGroup`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value === '' ? null : field.value}
                  disabled={!isEdit}
                  maxLength={4}
                  onChange={(e) => {
                    field.onChange(maxNumberLength(4, e.value));
                  }}
                  className={classNames({ 'w-6': true })}
                />
              )}
            />
            <span className="mx-2">/</span>
            <Controller
              name={`${[ID]}.RangeQty`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value === '' ? null : field.value}
                  disabled={!isEdit}
                  maxLength={4}
                  onChange={(e) => {
                    field.onChange(maxNumberLength(4, e.value));
                  }}
                  className={classNames({ 'w-6': true })}
                />
              )}
            />
          </div>
        </div>

        <div className="flex mb-2 w-full">
          <div className="w-5 text-right pr-4"></div>
          <div className="w-full">
            <h4 className="m-0 mb-2">{t('sts.label.rfsettings.load.num.changes.and.new.ids')}</h4>
            <div className="pl-4">
              <Controller
                name={`${[ID]}.AllowRFShipLoadNumberChanges`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center mb-2">
                    <Checkbox
                      {...field}
                      disabled={!isEdit}
                      inputId="AllowRFShipLoadNumberChanges"
                      checked={field.value}
                    />
                    <label htmlFor="AllowRFShipLoadNumberChanges" className="ml-2 cursor-pointer">
                      {t('sts.txt.rfsettings.allow.rf.recv.load.num.changes')}
                    </label>
                  </div>
                )}
              />
              <Controller
                name={`${[ID]}.AllowRFRecvLoadNumberChanges`}
                control={control}
                render={({ field }) => (
                  <div className="w-full flex align-items-center">
                    <Checkbox
                      {...field}
                      disabled={!isEdit}
                      inputId="AllowRFRecvLoadNumberChanges"
                      checked={field.value}
                    />
                    <label htmlFor="AllowRFRecvLoadNumberChanges" className="ml-2 cursor-pointer">
                      {t('sts.txt.rfsettings.allow.rf.ship.load.num.changes')}
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex mb-2 w-full">
          <div className="w-5 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.AllowInterimLoadShipments`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="AllowInterimLoadShipments"
                  checked={field.value}
                />
                <label htmlFor="AllowInterimLoadShipments" className="ml-2 cursor-pointer">
                  {t('sts.txt.rfsettings.allow.interim.load.shipments')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-5 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.TurnoffF8CapabilitiesOnAllScreens`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="TurnoffF8CapabilitiesOnAllScreens"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.checked);
                    setValue(`${[ID]}.TurnoffF8CapabilitiesExceptShipping`, false);
                  }}
                />
                <label htmlFor="TurnoffF8CapabilitiesOnAllScreens" className="ml-2 cursor-pointer">
                  {t('sts.txt.rfsettings.turn.off.f8.all.screens')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-5 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.TurnoffF8CapabilitiesExceptShipping`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="TurnoffF8CapabilitiesExceptShipping"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.checked);
                    setValue(`${[ID]}.TurnoffF8CapabilitiesOnAllScreens`, false);
                  }}
                />
                <label
                  htmlFor="TurnoffF8CapabilitiesExceptShipping"
                  className="ml-2 cursor-pointer"
                >
                  {t('sts.txt.rfsettings.turn.off.f8.except.shipping')}
                </label>
              </div>
            )}
          />
        </div>
        <div className="flex mb-2 w-full">
          <div className="w-5 text-right pr-4"></div>
          <Controller
            name={`${[ID]}.EnableLocationWtPcCalculationOnTrans`}
            control={control}
            render={({ field }) => (
              <div className="w-full flex align-items-center">
                <Checkbox
                  {...field}
                  disabled={!isEdit}
                  inputId="EnableLocationWtPcCalculationOnTrans"
                  checked={field.value}
                />
                <label
                  htmlFor="EnableLocationWtPcCalculationOnTrans"
                  className="ml-2 cursor-pointer"
                >
                  {t('sts.txt.rfsettings.enable.location.wt.and.pc.calculation.on.trans')}
                </label>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Wireless;
