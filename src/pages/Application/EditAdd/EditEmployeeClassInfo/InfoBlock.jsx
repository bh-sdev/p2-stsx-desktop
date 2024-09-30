import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';

import { GlobalContext } from 'pages/Application';
import { formatNumber, formatNumberInput, noNullValues, noSpaceOnStart, trimStartEnd } from 'utils';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { ContextEmployeeClassInfo } from '.';
import { removeEmptyParams } from 'api/general';
import {
  employeeClassById,
  employeeClassDelete,
  employeeClassNew,
  employeeClassNumbers,
  employeeClassOrdersGet,
  employeeClassUpdate,
} from 'api';
import { FORM_EMPLOYEE_CLASS } from 'configs/forms.config';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EmployeeClassInfoValidationSchema = yup.object({
  Code: yup.string().required(),
  Value: yup.lazy((value) => {
    if (value === '' || value === null) {
      return yup.string().nullable();
    }

    return yup
      .number()
      .test('len', '', (val) => String(val).length <= FORM_EMPLOYEE_CLASS.fieldLength.Value);
  }),
  Order: yup.lazy((value) => {
    if (value === '' || value === null) {
      return yup.string().nullable();
    }

    return yup
      .string()
      .test('len', '', (val) => String(val).length <= 22)
      .test('not-zero', '', (val) => val !== '0');
  }),
});

const InfoBlock = ({ created, updated, deleted, current, cancel }) => {
  const { refToast } = useContext(GlobalContext);
  const { matchSelect, classInfo, setIsEdit, isEdit, isNew, activeActions, Delete, Edit } =
    useContext(ContextEmployeeClassInfo);
  const { t } = useTranslation();
  const [employeeClassInfo, setEmployeeClassInfo] = useState({});
  const [orderNumbers, setOrderNumbers] = useState(null);
  const [busy, setIsBusy] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(EmployeeClassInfoValidationSchema),
  });
  const [numberSuggestions, setNumberSuggestions] = useState([]);

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await employeeClassNumbers({ prefix });
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

  const matchOrderNumbers = async (query) => {
    const { Entries } = await employeeClassOrdersGet();
    const lowerCaseQuery = query.toLowerCase();
    const result = Entries.filter((item) => String(item).toLowerCase().includes(lowerCaseQuery));
    setOrderNumbers(result);
  };

  useEffect(() => {
    reset(noNullValues(employeeClassInfo));
  }, [isEdit]);

  useEffect(() => {
    if (current.ID) {
      loadEmployeeClassInfo();
    } else {
      setEmployeeClassInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadEmployeeClassInfo = async () => {
    try {
      const res = await employeeClassById(current.ID);
      const resultData = {
        ...res,
        Order: res.Order === 0 ? null : res.Order ? BigInt(res.Order).toLocaleString() : res.Order,
      };

      setEmployeeClassInfo(resultData);
      reset(noNullValues(resultData));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const createNew = async (data) => {
    try {
      const preparedData = {
        ...data,
        Order: data.Order == 0 ? null : Number(data.Order.replace(/,/g, '')),
      };
      setIsBusy(true);
      const res = await employeeClassNew(noSpaceOnStart(removeEmptyParams(preparedData)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee_class_info.created'),
        header: t('sts.txt.employee_class_info.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.window.employee.class')} ${data.Code}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      } else {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const update = async (data) => {
    const preparedData = {
      ...data,
      Order: data.Order == 0 ? null : Number(data.Order.replace(/,/g, '')),
    };
    try {
      setIsBusy(true);
      const res = await employeeClassUpdate(
        current.ID,
        noSpaceOnStart(removeEmptyParams(preparedData)),
      );
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee_class_info.updated'),
        header: t('sts.txt.employee_class_info.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.window.employee.class')} ${data.Code}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      } else {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    try {
      await employeeClassDelete(employeeClassInfo.ID);
      setIsEdit(false);
      deleted();
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const deleteEmployeeClass = async () => {
    try {
      await employeeClassDelete(employeeClassInfo.ID, { dry_run: true });
      confirmDialog({
        message: t('sts.txt.remove.employee.class.delete', {
          0: employeeClassInfo.Code,
        }),
        header: t('sts.txt.remove.employee.class'),
        icon: 'pi pi-exclamation-triangle text-yellow-500',
        rejectClassName: 'p-button-danger',
        acceptLabel: t('sts.btn.cancel'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.delete'),
        reject: () => {
          setTimeout(() => {
            confirmDialog({
              closable: false,
              message: t('1072'),
              acceptLabel: t('sts.btn.no'),
              acceptClassName: 'p-button-secondary',
              rejectLabel: t('sts.btn.yes'),
              rejectClassName: 'p-button-primary',
              accept: deleteRequest,
              icon: 'pi pi-question-circle text-blue-400',
            });
          }, 100);
        },
      });
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };
  const classInfoNumberFieldFlow = (value, field) => {
    const CLASS_INFO = classInfo.find(({ Code }) => Code === value);
    if ((isNew || isEdit) && CLASS_INFO) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee_code.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(employeeClassInfo.Code);
        },
        reject: () => {
          matchSelect(CLASS_INFO);
        },
      });
    } else {
      if (!CLASS_INFO) {
        numberSuggestions.find(({ ClassCode }) => ClassCode === value) &&
          confirmDialog({
            closable: false,
            message: t('429'),
            header: t('429'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(employeeClassInfo.Code);
            },
          });
        !isEdit && !isNew && field.onChange(employeeClassInfo.Code);
      } else {
        matchSelect(CLASS_INFO);
      }
    }
  };

  return !Object.keys(employeeClassInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-end">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column pb-3">
            <AutoSizer className="flex-auto w-full">
              {({ height }) => (
                <ScrollPanel
                  style={{ width: '100%', height: `${height}px` }}
                  pt={{
                    content: {
                      className: 'p-0',
                    },
                    bary: {
                      className: 'bg-bluegray-300',
                    },
                  }}
                >
                  <div className="flex-auto w-30rem">
                    <form className="p-fluid">
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.class.code')}:</div>
                          <Controller
                            name="Code"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`Code_${index}`} label={value} />
                                )}
                                dropdown
                                onSelect={(e) => {
                                  if (employeeClassInfo !== e.value) {
                                    classInfoNumberFieldFlow(e.value, field);
                                  }
                                }}
                                onBlur={(e) => {
                                  field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                  setTimeout(() => {
                                    if (employeeClassInfo.Code !== e.target.value) {
                                      classInfoNumberFieldFlow(e.target.value, field);
                                    }
                                  }, 400);
                                }}
                                onChange={(e) => {
                                  field.onChange((e.value?.label || e.value).toUpperCase());
                                }}
                                autoHighlight
                                completeMethod={(e) => matchNumber(e.query)}
                                suggestions={numberSuggestions.map((el) => el.ClassCode)}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORM_EMPLOYEE_CLASS.fieldLength.Code}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.class.description')}:</div>
                          <Controller
                            name="Description"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORM_EMPLOYEE_CLASS.fieldLength.Description}
                              />
                            )}
                            max
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.class.order.number')}:</div>
                          <Controller
                            name="Order"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`Order_${index}`} label={value} />
                                )}
                                disabled={!isNew && !isEdit}
                                dropdown
                                maxLength={22}
                                onKeyPress={(e) => {
                                  if (e.key === '.') {
                                    e.preventDefault();
                                  }
                                }}
                                autoHighlight
                                onChange={(event) => field.onChange(formatNumberInput(event.value))}
                                completeMethod={(e) => matchOrderNumbers(e.query)}
                                suggestions={orderNumbers}
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
                          <div className="mr-4 w-7">{t('sts.label.class.uom')}:</div>
                          <Controller
                            name="UOM"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORM_EMPLOYEE_CLASS.fieldLength.Uom}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.class.value')}:</div>
                          <Controller
                            name="Value"
                            control={control}
                            render={({ field }) => (
                              <InputNumber
                                {...field}
                                value={field.value === '' ? null : field.value}
                                maxFractionDigits={10}
                                onBlur={(e) => field.onChange(formatNumber(e.target.value))}
                                onChange={(e) => {
                                  field.onChange(e.value);
                                }}
                                disabled={!isEdit && !isNew}
                                className={classNames({
                                  'w-full': true,
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
      </div>
      <div className="flex justify-content-end gap-2">
        {isNew ? (
          <>
            <Button
              disabled={!isValid}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(createNew)}
            />
            <Button label={t('sts.btn.cancel')} disabled={busy} size="small" onClick={cancel} />
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.delete')}
              severity="danger"
              size="small"
              disabled={!Delete}
              onClick={deleteEmployeeClass}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
            disabled={!activeActions || (!Edit && !Delete)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
