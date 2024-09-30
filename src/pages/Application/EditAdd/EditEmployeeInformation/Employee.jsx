import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';
import { confirmDialog } from 'primereact/confirmdialog';

import { employeeAssociations, employeeNumbers } from 'api';
import { FORMS_CONFIG } from 'configs';
import { ContextEditEmployeeInformation } from '.';
import { GlobalContext } from 'pages/Application';
import { trimStartEnd } from 'utils';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const Employee = ({ data, isEdit, control }) => {
  const { refToast } = useContext(GlobalContext);
  const [associations, setAssociations] = useState([]);
  const { accounts, matchSelect, classIds, isNew, withInactive } = useContext(
    ContextEditEmployeeInformation,
  );
  const { t } = useTranslation();
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const refFullListOfNumbers = useRef([]);
  const refNumber = useRef(data.Number);

  useEffect(() => {
    getAllEmployeeNumbers();
    getAllAssociations();
  }, []);

  const getAllEmployeeNumbers = async () => {
    try {
      const { Numbers } = await employeeNumbers({ with_inactive: true });
      refFullListOfNumbers.current = Numbers;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const matchNumber = async (prefix) => {
    try {
      const { Numbers } = await employeeNumbers({
        prefix,
        with_inactive: withInactive,
      });
      setNumberSuggestions(Numbers.map((item) => ({ label: item.EmployeeNumber, value: item })));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const getAllAssociations = async () => {
    try {
      const { Entries } = await employeeAssociations();
      setAssociations(Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)));
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

  const EmployeeFieldFlow = (value, field) => {
    const EMPLOYEE = accounts.find(({ Number }) => Number === value);
    if ((isNew || isEdit) && EMPLOYEE) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(data.Number);
        },
        reject: () => {
          matchSelect(EMPLOYEE);
          refNumber.current = EMPLOYEE.Number;
        },
      });
    } else {
      if (!EMPLOYEE) {
        refFullListOfNumbers.current.find(({ EmployeeNumber }) => EmployeeNumber === value) &&
          confirmDialog({
            closable: false,
            message: t('429'),
            header: t('429'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(data.Number);
            },
          });
        !isEdit && !isNew && field.onChange(data.Number);
      } else {
        matchSelect(EMPLOYEE);
        refNumber.current = EMPLOYEE.Number;
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
                      <div className="mr-4 w-7">{t('sts.label.employee.number')}:</div>
                      <Controller
                        name="Number"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`Number_${index}`} label={value.label} />
                            )}
                            dropdown
                            onChange={(e) => {
                              field.onChange((e.value?.label || e.value).toUpperCase());
                            }}
                            onSelect={(e) => {
                              if (refNumber.current !== e.value.label) {
                                EmployeeFieldFlow(e.value.label, field);
                              }
                            }}
                            onBlur={(e) => {
                              field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                              setTimeout(() => {
                                if (refNumber.current !== e.target.value) {
                                  EmployeeFieldFlow(e.target.value, field);
                                }
                              }, 400);
                            }}
                            autoHighlight
                            field="label"
                            completeMethod={(e) => matchNumber(e.query)}
                            suggestions={numberSuggestions}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.Number}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.name.first')}:</div>
                      <Controller
                        name="FirstName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              required: true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.FirstName}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.name.middle')}:</div>
                      <Controller
                        name="MiddleName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.MiddleName}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.name.last')}:</div>
                      <Controller
                        name="LastName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              required: true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.LastName}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.fab.shop')}:</div>
                      <Controller
                        name="AssociationID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Dropdown
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            options={associations?.map(({ ID, Name }) => ({
                              label: Name,
                              value: ID,
                            }))}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.AssociationID}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.login.name')}:</div>
                      <Controller
                        name="LoginName"
                        control={control}
                        render={({ field }) => (
                          <div className="w-full">{field.value || t('sts.txt.not.associated')}</div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center mb-2">
                      <div className="mr-4 w-7"></div>
                      <div className="flex align-items-center w-full">
                        <Controller
                          name="ActivityLogging"
                          control={control}
                          render={({ field, fieldState }) => (
                            <>
                              <Checkbox
                                disabled={!isActiveFields}
                                {...field}
                                inputId="ActivityLogging"
                                checked={field.value}
                                className={classNames({
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                              <label htmlFor="ActivityLogging" className="ml-2">
                                {t('sts.chk.logging')}
                              </label>
                            </>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex align-items-center mb-2">
                      <div className="mr-4 w-7"></div>
                      <div className="flex align-items-center w-full">
                        <Controller
                          name="IsActive"
                          control={control}
                          render={({ field, fieldState }) => (
                            <>
                              <Checkbox
                                disabled={!isActiveFields}
                                {...field}
                                inputId="IsActive"
                                checked={field.value}
                                className={classNames({
                                  'p-invalid': fieldState.invalid,
                                })}
                              />
                              <label htmlFor="IsActive" className="ml-2">
                                {t('sts.chk.employee.active')}
                              </label>
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.employee.class.id')}:</div>
                      <Controller
                        name="ClassID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Dropdown
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            options={classIds.map(({ ClassID, ClassCode }) => ({
                              label: ClassCode,
                              value: ClassID,
                            }))}
                            placeholder=" "
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.ClassID}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.party.employee.login')}:</div>
                      <Controller
                        name="UserName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.ThirdPartyLogin}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {/* <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.employee.sds.employee.id')}:</div>
                      <Controller
                        name="FTEmployeeID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputNumber
                            disabled={!isActiveFields}
                            id={field.name}
                            useGrouping={false}
                            {...field}
                            onChange={(e) => field.onChange(e.value)}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.FTEmployeeID}
                          />
                        )}
                      />
                    </div>
                  </div> */}
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.email')}:</div>
                      <Controller
                        name="Email"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            name="Email"
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.Email}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.work')}:</div>
                      <Controller
                        name="WorkPhone"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.WorkPhone}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.cell')}:</div>
                      <Controller
                        name="CellPhone"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.CellPhone}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.1')}:</div>
                      <Controller
                        name="OtherPhone1"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.OtherPhone2}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.2')}:</div>
                      <Controller
                        name="OtherPhone2"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.OtherPhone3}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {/* <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.phone.number.3')}:</div>
                      <Controller
                        name="OtherPhone3"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isActiveFields}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_EMPLOYEE.fieldLength.OtherPhone4}
                          />
                        )}
                      />
                    </div>
                  </div> */}
                </form>
              </div>
            </ScrollPanel>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Employee;
