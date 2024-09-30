import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller } from 'react-hook-form';

import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';

import { FORMS_CONFIG } from 'configs';

const Personal = ({ control, isEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-column">
      <div className="flex-auto flex flex-column pb-2">
        <AutoSizer className="flex-auto w-full">
          {() => (
            <ScrollPanel
              style={{ width: '100%', height: `100%` }}
              pt={{
                bary: {
                  className: 'bg-bluegray-300',
                },
              }}
            >
              <div className="flex-auto w-30rem">
                <form className="p-fluid">
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.employee.ssn')}:</div>
                      <Controller
                        name="Ssn"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            {...field}
                            disabled={!isEdit}
                            placeholder="...-..-...."
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.Ssn}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.birthday')}:</div>
                      <Controller
                        name="Dob"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Calendar
                            {...field}
                            //Todo: need investigate how to set defaultValue correctly!
                            value={field.value ? new Date(field.value) : ''}
                            dateFormat="mm/dd/yy"
                            placeholder="mm/dd/yyyy"
                            showIcon
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.employee.hire.date')}:</div>
                      <Controller
                        name="HireDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Calendar
                            {...field}
                            //Todo: need investigate how to set defaultValue correctly!
                            value={field.value ? new Date(field.value) : ''}
                            dateFormat="mm/dd/yy"
                            placeholder="mm/dd/yyyy"
                            showIcon
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.employee.termination.date')}:</div>
                      <Controller
                        name="TerminationDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Calendar
                            {...field}
                            //Todo: need investigate how to set defaultValue correctly!
                            value={field.value ? new Date(field.value) : ''}
                            dateFormat="mm/dd/yy"
                            placeholder="mm/dd/yyyy"
                            showIcon
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </ScrollPanel>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Personal;
