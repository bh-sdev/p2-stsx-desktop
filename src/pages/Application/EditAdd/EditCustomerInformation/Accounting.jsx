import AutoSizer from 'react-virtualized-auto-sizer';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { ScrollPanel } from 'primereact/scrollpanel';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { Checkbox } from 'primereact/checkbox';
import { FORM_CUSTOMER } from 'configs/forms.config';
import { formatNumber } from 'utils';

const Accounting = ({ control, isEdit }) => {
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
                      <div className="mr-4 w-7">
                        <label htmlFor="appliesTax">{t('sts.label.applies.tax')}</label>
                      </div>
                      <Controller
                        name="Applystax"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="w-full">
                            <Checkbox
                              {...field}
                              disabled={!isEdit}
                              inputId="appliesTax"
                              checked={field.value}
                              className={classNames({
                                'p-invalid': fieldState.invalid,
                              })}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.qb.contact.name')}:</div>
                      <Controller
                        name="QuickbooksContactName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            {...field}
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORM_CUSTOMER.fieldLength.QuickbooksContactName}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.qb.core.ref.num')}:</div>
                      <Controller
                        name="QuickbooksCoreReferenceNumber"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            maxFractionDigits={10}
                            value={field.value === '' ? null : field.value}
                            onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                            onChange={(e) => {
                              field.onChange(e.value === null ? '' : e.value);
                            }}
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
                      <div className="mr-4 w-7">{t('sts.label.qb.state.tax.account')}:</div>
                      <Controller
                        name="QuickbooksStateTaxAccount"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            {...field}
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORM_CUSTOMER.fieldLength.QuickbooksStateTaxAccount}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.qb.state.tx.agent')}:</div>
                      <Controller
                        name="QuickbooksStateTaxAgent"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            {...field}
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORM_CUSTOMER.fieldLength.QuickbooksStateTaxAgent}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.local.tax')}:</div>
                      <Controller
                        name="Staxlocal"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            value={field.value === '' ? null : field.value}
                            maxFractionDigits={10}
                            onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                            onChange={(e) => {
                              field.onChange(e.value === null ? '' : e.value);
                            }}
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
                      <div className="mr-4 w-7">{t('sts.label.misc.tax')}:</div>
                      <Controller
                        name="Staxmisc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            value={field.value === '' ? null : field.value}
                            maxFractionDigits={10}
                            onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                            onChange={(e) => {
                              field.onChange(e.value === null ? '' : e.value);
                            }}
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
                      <div className="mr-4 w-7">{t('sts.label.tax.mta')}:</div>
                      <Controller
                        name="Staxmta"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            value={field.value === '' ? null : field.value}
                            maxFractionDigits={10}
                            onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                            onChange={(e) => {
                              field.onChange(e.value === null ? '' : e.value);
                            }}
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
                      <div className="mr-4 w-7">{t('table.customers.staxstate')}:</div>
                      <Controller
                        name="Staxstate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            {...field}
                            value={field.value === '' ? null : field.value}
                            maxFractionDigits={10}
                            onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                            onChange={(e) => {
                              field.onChange(e.value === null ? '' : e.value);
                            }}
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

export default Accounting;
