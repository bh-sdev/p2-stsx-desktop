import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';

import { ContextEditCustomerInformation } from '.';
import { customerNames, customerNumbers } from 'api';
import { GlobalContext } from 'pages/Application';
import { FORMS_CONFIG } from 'configs';
import { confirmDialog } from 'primereact/confirmdialog';
import { trimStartEnd } from 'utils';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const Customer = ({ data, isEdit, control }) => {
  const { refToast } = useContext(GlobalContext);
  const { accounts, matchSelect, isNew } = useContext(ContextEditCustomerInformation);
  const { t } = useTranslation();
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await customerNumbers({ prefix });
      setNumberSuggestions(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const isActiveFields = isNew || isEdit;

  const matchNames = async (prefix) => {
    try {
      const { Entries } = await customerNames({ prefix });
      setNameSuggestions(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const customerNumberFieldFlow = (value, field) => {
    const CUSTOMER = accounts.find(({ CustomerNumber }) => CustomerNumber === value);
    if ((isNew || isEdit) && CUSTOMER) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.customer.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(data.CustomerNumber);
        },
        reject: () => {
          matchSelect(CUSTOMER);
        },
      });
    } else {
      if (!CUSTOMER) {
        numberSuggestions.find(({ label }) => label === value) &&
          confirmDialog({
            closable: false,
            message: t('429'),
            header: t('429'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(data.CustomerNumber);
            },
          });
        !isEdit && !isNew && field.onChange(data.CustomerNumber);
      } else {
        matchSelect(CUSTOMER);
      }
    }
  };

  return (
    <div className="h-full flex flex-column">
      <div className="h-full flex flex-column pb-2">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => (
            <ScrollPanel
              style={{ width: '100%', height: `${height}px` }}
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
                      <div className="mr-4 w-7">{t('sts.label.customer.number')}:</div>
                      <Controller
                        name="CustomerNumber"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            dropdown
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`CustomerNumber_${index}`} label={value} />
                            )}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase());
                            }}
                            onSelect={(e) => {
                              if (data.CustomerNumber !== e.value) {
                                customerNumberFieldFlow(e.value, field);
                              }
                            }}
                            onBlur={(e) => {
                              field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                              setTimeout(() => {
                                if (data.CustomerNumber !== e.target.value) {
                                  customerNumberFieldFlow(e.target.value, field);
                                }
                              }, 400);
                            }}
                            autoHighlight
                            completeMethod={(e) => matchNumber(e.query)}
                            suggestions={numberSuggestions}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.CustomerNumber}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.company.name')}:</div>
                      <Controller
                        name="CorporationName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`CorporationName_${index}`} label={value} />
                            )}
                            disabled={!isActiveFields}
                            dropdown
                            autoHighlight
                            completeMethod={(e) => matchNames(e.query)}
                            suggestions={nameSuggestions}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.CorporationName}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.representative')}:</div>
                      <Controller
                        name="Representative"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Representative}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.prefix')}:</div>
                      <Controller
                        name="BarcodePrefix"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            {...field}
                            disabled={!isActiveFields}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase());
                            }}
                            className={classNames({
                              required: true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_BAR_CODE.fieldLength.BarcodePrefix}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.email')}:</div>
                      <Controller
                        name="Email"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Email}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.fax.number')}:</div>
                      <Controller
                        name="Fax"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Fax}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number')}:</div>
                      <Controller
                        name="Phone"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Phone}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.1')}:</div>
                      <Controller
                        name="Phone1"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Phone1}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.2')}:</div>
                      <Controller
                        name="Phone2"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Phone2}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.3')}:</div>
                      <Controller
                        name="Phone3"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Phone3}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.web.page')}:</div>
                      <Controller
                        name="Webpage"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Webpage}
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

export default Customer;
