import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

const DataPaths = ({ ID, control }) => {
  const { t } = useTranslation();

  return (
    <div className="fadein">
      <div className="mw:w-full ml-4" style={{ width: '50rem' }}>
        <div className="flex mb-2 w-full required align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.server.default.dir')}:</div>
          <Controller
            name={`${[ID]}.Base`}
            control={control}
            render={({ field }) => (
              <span className={classNames({ 'w-full h-2rem flex align-items-center': true })}>
                {field.value}
              </span>
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.warehouse32')}:</div>
          <Controller
            name={`${[ID]}.WareHouse`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.temp')}:</div>
          <Controller
            name={`${[ID]}.Temp`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.export')}:</div>
          <Controller
            name={`${[ID]}.Export`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.import')}:</div>
          <Controller
            name={`${[ID]}.Import`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.foxfire')}:</div>
          <Controller
            name={`${[ID]}.FoxFire`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.reports')}:</div>
          <Controller
            name={`${[ID]}.ReportForm`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
        <div className="flex mb-2 w-full align-items-center">
          <div className="w-5 text-right pr-4">{t('sts.label.datapaths.mtr.pdf')}:</div>
          <Controller
            name={`${[ID]}.MTRPDF`}
            control={control}
            render={({ field }) => (
              <InputText {...field} readOnly className={classNames({ 'w-full': true })} />
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default DataPaths;
