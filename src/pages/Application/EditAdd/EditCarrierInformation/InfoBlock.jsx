import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';
import isEmail from 'validator/lib/isEmail';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';

import { GlobalContext } from 'pages/Application';
import { noNullValues, noSpaceOnStart, trimStartEnd } from 'utils';
import {
  carrierById,
  carrierDelete,
  carrierNew,
  carrierNumbers,
  carrierUpdate,
  getCities,
  getZipCodeById,
  getZipCodes,
} from 'api';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { ContextEditEditCarrierInformation } from '.';
import { removeEmptyParams } from 'api/general';
import { FORMS_CONFIG } from 'configs';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const CarrierValidationSchema = yup.object({
  CarrierNumber: yup.string().trim().required(),
  State: yup.string().test({
    name: 'lng',
    test: (value) => (value ? value.length === FORMS_CONFIG.FORM_ADDRESS.fieldLength.State : true),
  }),
  Email: yup
    .string()
    .trim()
    .test({
      name: 'Email',
      test: (value) => (value ? isEmail(value) : true),
    }),
});

const InfoBlock = ({ created, updated, deleted, current, cancel }) => {
  const { refToast } = useContext(GlobalContext);
  const {
    matchSelect,
    accounts,
    setIsEdit,
    isEdit,
    isNew,
    activeActions,
    withInactive,
    Delete,
    Edit,
  } = useContext(ContextEditEditCarrierInformation);
  const { t } = useTranslation();
  const [carrierInfo, setCarrierInfo] = useState({});
  const [busy, setIsBusy] = useState(false);
  const [zipCodes, setZipCodes] = useState([]);
  const [citiesSuggestions, setCitiesSuggestions] = useState([]);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(CarrierValidationSchema),
  });
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const refFullListOfNumbers = useRef([]);

  useEffect(() => {
    getAllCarrierNumbers();
  }, []);

  const getAllCarrierNumbers = async () => {
    try {
      const { Entries } = await carrierNumbers({ with_inactive: true });
      refFullListOfNumbers.current = Entries;
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
      const { Entries } = await carrierNumbers({
        prefix,
        with_inactive: withInactive,
      });
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

  useEffect(() => {
    reset(noNullValues(carrierInfo));
  }, [isEdit]);

  useEffect(() => {
    if (current.ID) {
      loadCarrierInfo();
    } else {
      setCarrierInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadCarrierInfo = async () => {
    try {
      const res = await carrierById(current.ID);
      setCarrierInfo(res);
      reset(noNullValues(res));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const matchZipCode = async (prefix) => {
    try {
      const { Entries } = await getZipCodes({ prefix });
      setZipCodes(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const searchCity = async (event) => {
    try {
      const { Entries } = await getCities({ prefix: event.query });
      setCitiesSuggestions(Entries);
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
      setIsBusy(true);
      const res = await carrierNew(noSpaceOnStart(removeEmptyParams(data)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.carrier.created'),
        header: t('sts.txt.carrier.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.txt.carrier')} ${data.CarrierNumber}`,
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
    try {
      setIsBusy(true);
      const res = await carrierUpdate(current.ID, noSpaceOnStart(removeEmptyParams(data)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.carrier.updated'),
        header: t('sts.txt.carrier.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.txt.carrier')} ${data.CarrierNumber}`,
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
      await carrierDelete(carrierInfo.ID);
      setIsEdit(false);
      deleted();
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }
  };

  const deleteCarrier = async () => {
    try {
      await carrierDelete(carrierInfo.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.this.carrier', {
          0: carrierInfo.CarrierNumber,
        }),
        header: t('sts.txt.remove.carrier'),
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

  const carrierNumberFieldFlow = (value, field) => {
    const CARRIER = accounts.find(({ CarrierNumber }) => CarrierNumber === value);
    if ((isNew || isEdit) && CARRIER) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.carrier.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(carrierInfo.CarrierNumber);
        },
        reject: () => {
          matchSelect(CARRIER);
        },
      });
    } else {
      if (!CARRIER) {
        refFullListOfNumbers.current.includes(value) &&
          confirmDialog({
            closable: false,
            message: t('sts.txt.carrier.inactive'),
            header: t('sts.txt.carrier.inactive'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(carrierInfo.CarrierNumber);
            },
          });
        !isEdit && !isNew && field.onChange(carrierInfo.CarrierNumber);
      } else {
        matchSelect(CARRIER);
      }
    }
  };

  return !Object.keys(carrierInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-end">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column pb-2">
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
                          <div className="mr-4 w-7">{t('table.carrier.carrier_n')}:</div>
                          <Controller
                            name="CarrierNumber"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                dropdown
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`CarrierNumber_${index}`}
                                    label={value}
                                  />
                                )}
                                onSelect={(e) => {
                                  if (carrierInfo.CarrierNumber !== e.value) {
                                    carrierNumberFieldFlow(e.value, field);
                                  }
                                }}
                                onBlur={(e) => {
                                  field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                  setTimeout(() => {
                                    if (carrierInfo.CarrierNumber !== e.target.value) {
                                      carrierNumberFieldFlow(e.target.value, field);
                                    }
                                  }, 400);
                                }}
                                onChange={(e) => {
                                  field.onChange((e.value?.label || e.value).toUpperCase());
                                }}
                                autoHighlight
                                completeMethod={(e) => matchNumber(e.query)}
                                suggestions={numberSuggestions}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.Number}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('table.carrier.carrier_name')}:</div>
                          <Controller
                            name="CarrierName"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.Name}
                              />
                            )}
                            max
                          />
                        </div>
                      </div>
                      <div className="flex align-items-center mb-2">
                        <div className="mr-4 w-7"></div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="IsActive"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  disabled={!isEdit && !isNew}
                                  {...field}
                                  inputId="IsActive"
                                  checked={field.value}
                                />
                                <label htmlFor="IsActive" className="ml-2">
                                  {t('table.general.active')}
                                </label>
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.line1')}:</div>
                          <Controller
                            name="Line1"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Line1}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.line2')}:</div>
                          <Controller
                            name="Line2"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Line2}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.zip.code')}:</div>
                          <Controller
                            name="ZipCode"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`ZipCode_${index}`} label={value} />
                                )}
                                autoHighlight
                                completeMethod={(event) => matchZipCode(event.query)}
                                suggestions={zipCodes}
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                onSelect={async ({ value }) => {
                                  getZipCodeById(value).then(({ PrimaryCity, State }) => {
                                    !getValues().State && setValue('State', State);
                                    !getValues().City && setValue('City', PrimaryCity);
                                  });
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const value = e.target.value;
                                    if (value && zipCodes.includes(value)) {
                                      getZipCodeById(value).then(({ PrimaryCity, State }) => {
                                        !getValues().State && setValue('State', State);
                                        !getValues().City && setValue('City', PrimaryCity);
                                      });
                                    }
                                    if (value && (!zipCodes.length || !zipCodes?.includes(value))) {
                                      confirmDialog({
                                        closable: false,
                                        header: 7001,
                                        message: t('7001'),
                                        acceptLabel: t('sts.btn.ok'),
                                        rejectClassName: 'hidden',
                                        icon: 'pi pi-exclamation-triangle text-yellow-500',
                                        accept: () => {
                                          setTimeout(() => {
                                            confirmDialog({
                                              closable: false,
                                              header: t('sts.txt.use.this.entry.anyway'),
                                              message: t('sts.txt.use.this.entry.anyway'),
                                              acceptLabel: t('sts.btn.no'),
                                              acceptClassName: 'p-button-secondary',
                                              rejectLabel: t('sts.btn.yes'),
                                              rejectClassName: 'secondary',
                                              icon: 'pi pi-question-circle text-blue-400',
                                              accept: () => {
                                                setValue('ZipCode', '');
                                              },
                                            });
                                          }, 100);
                                        },
                                      });
                                    }
                                  }, 400);
                                }}
                                maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Zipcode}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.city')}:</div>
                          <Controller
                            name="City"
                            control={control}
                            render={({ field }) => (
                              <AutoComplete
                                dropdown
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip id={`City_${index}`} label={value} />
                                )}
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                autoHighlight
                                completeMethod={searchCity}
                                suggestions={citiesSuggestions}
                                maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.City}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.state')}:</div>
                          <Controller
                            name="State"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.State}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.contact.name')}:</div>
                          <Controller
                            name="ContactName"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.Contact}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.email')}:</div>
                          <Controller
                            name="Email"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.Email}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.phone.cell')}:</div>
                          <Controller
                            name="CellPhone"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.CellPhone}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.phone.work')}:</div>
                          <Controller
                            name="WorkPhone"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.WorkPhone}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.phone.two')}:</div>
                          <Controller
                            name="OtherPhone2"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.OtherPhone2}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.phone.three')}:</div>
                          <Controller
                            name="OtherPhone3"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.OtherPhone3}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-7">{t('sts.label.carrier.phone.fax')}:</div>
                          <Controller
                            name="Fax"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                id={field.name}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_CARRIER.fieldLength.Fax}
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
              disabled={!Delete}
              severity="danger"
              size="small"
              onClick={deleteCarrier}
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
