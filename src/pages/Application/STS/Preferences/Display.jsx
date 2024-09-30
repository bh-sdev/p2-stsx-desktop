import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { Dropdown } from 'primereact/dropdown';

import { preferencesDisplayLangsGet } from 'api';
import { GlobalContext } from 'pages/Application';

const Display = ({ ID, isEdit, control, getRefs, screenRefs }) => {
  const { t } = useTranslation();
  const { refToast } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      try {
        const { Entries } = await preferencesDisplayLangsGet();
        getRefs({ langs: Entries });
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
          <div className="w-3 text-right pr-4">{t('sts.label.display.language')}:</div>
          <div className="flex w-full">
            <Controller
              name={`${[ID]}.Lang`}
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={screenRefs?.langs?.map(({ ID, Name }) => ({
                    label: Name,
                    value: ID,
                  }))}
                  optionValue="value"
                  disabled={!isEdit}
                  className="w-15rem"
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Display;
