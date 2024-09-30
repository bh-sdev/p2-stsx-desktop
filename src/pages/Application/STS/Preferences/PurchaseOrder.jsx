import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { RadioButton } from 'primereact/radiobutton';

const PurchaseOrder = ({ isEdit, ID, control }) => {
  const { t } = useTranslation();

  const VALUES = [
    { Name: t('sts.txt.poinfo.use.job.po.number'), ID: 'Use The Job P.O. Number' },
    { Name: t('sts.txt.poinfo.use.load.po.number'), ID: 'Use The Load P.O. Number' },
  ];

  return (
    <div className="fadein">
      <div className="required w-15rem h-3rem flex align-items-center justify-content-center">
        <h4 className="m-0">{t('sts.label.poinfo.when.calc.cost')}</h4>
      </div>
      <div>
        <h4>{t('sts.label.poinfo.po_num')}</h4>
        <div className="pl-4">
          <Controller
            name={`${[ID]}.PurchaseOrder`}
            control={control}
            render={({ field }) =>
              VALUES.map(({ Name, ID }) => (
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
  );
};

export default PurchaseOrder;
