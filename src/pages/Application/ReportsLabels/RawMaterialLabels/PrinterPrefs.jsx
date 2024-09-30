import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Checkbox } from 'primereact/checkbox';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';

import { FORM_LOGON_ACCESS } from 'configs/forms.config';
import {
  getPrefs,
  getRefLabels,
  getRefPrinterLabelLase,
  getRefPrinterNames,
} from 'api/api.raw.materials';
import useWindowControl from 'hooks/useWindowControl';
import { searchInArray } from 'utils';

import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { GlobalContext } from '../../index';
import { InputText } from 'primereact/inputtext';
import { DEFAULT_ROW_HEIGHT } from 'const';

const ValidationSchema = yup.object({
  PrinterNameID: yup.lazy((value) => {
    if (typeof value !== 'string') {
      return yup.object();
    }

    return yup.string().when('BarTenderInstalled', {
      is: true,
      then: (schema) => schema.required(),
    });
  }),
  LabelNameID: yup.lazy((value) => {
    if (typeof value !== 'string') {
      return yup.object();
    }

    return yup.string().when('SendLabeltoBarTender', {
      is: false,
      then: (schema) => schema.required(),
    });
  }),
  LabeLaseTemplateID: yup.lazy((value) => {
    if (value === '') {
      return yup.string().when('LabeLaseInstalled', {
        is: true,
        then: (schema) => schema.required(),
      });
    }

    return yup.string().when('UseLabeLasePrinter', {
      is: false,
      then: (schema) => schema.required(),
    });
  }),
});

const PrinterPrefs = ({
  getButtonState,
  setPrefsInfo,
  prefInfo,
  resetPref,
  getPrinterFormValues,
  getIsDirty,
  setPrinterValue,
  job,
}) => {
  const { blockedAll } = useWindowControl(window.name, false);
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [labels, setPrinterLabels] = useState([]);
  const [labeLase, setLabeLase] = useState([]);
  const refPrinterName = useRef(null);
  const refLabelName = useRef(null);
  const refLabeLase = useRef(null);
  const {
    control,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
    trigger,
    reset,
    formState: { isValid, isDirty, errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: async () => {
      const res = await getPrefs();
      setPrefsInfo(res);
      return {
        ...res,
        ...res['RawMaterialSettings'],
        ...{ SendLabeltoBarTender: res.BarTenderInstalled },
        ...{
          UseLabeLasePrinter:
            res.LabeLaseInstalled && res.BarTenderInstalled ? false : res.LabeLaseInstalled,
        },
      };
    },
    resolver: yupResolver(ValidationSchema),
  });

  const UseLabeLasePrinter = watch('UseLabeLasePrinter');
  const SendLabeltoBarTender = watch('SendLabeltoBarTender');

  useEffect(() => {
    resetPref(reset);
  }, [resetPref, reset]);

  useEffect(() => {
    setPrinterValue(setValue);
  }, [setPrinterValue, setValue]);

  useEffect(() => {
    getPrinterFormValues(getValues);
  }, [getValues]);

  useEffect(() => {
    getIsDirty(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (prefInfo) {
      if (!prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid) {
        setError('LabeLaseTemplateID', {
          type: 'validate',
          message: '',
        });
      }
      if (!prefInfo.RawMaterialDecor?.LabelName.IsValid) {
        setError('LabelNameID', {
          type: 'validate',
          message: '',
        });
      }
      if (!prefInfo.RawMaterialDecor?.PrinterName.IsValid) {
        setError('PrinterNameID', {
          type: 'validate',
          message: '',
        });
      }
    }
  }, [prefInfo, errors]);

  useEffect(() => {
    getButtonState(Boolean(isValid));
  }, [isValid, Object.keys(errors).length, SendLabeltoBarTender, UseLabeLasePrinter]);

  const getPrinterLabels = async (query) => {
    try {
      const { Entries } = await getRefLabels();
      const RES = searchInArray(
        getName([{ ID: t('sts.status.noneTr'), Name: t('sts.status.noneTr') }, ...Entries]),
        query,
      );
      setPrinterLabels(RES);
      return RES;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };
  const getName = (array) =>
    array.map((item) => (item?.IsDefault ? `${item?.ID} (default)` : item?.Name));

  const matchNames = async (query) => {
    try {
      const { Entries } = await getRefPrinterNames();
      setNameSuggestions(searchInArray(getName(Entries), query));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const getLabeLase = async (query) => {
    try {
      const { Entries } = await getRefPrinterLabelLase();
      const RES = searchInArray(
        getName([{ ID: t('sts.status.noneTr'), Name: t('sts.status.noneTr') }, ...Entries]),
        query,
      );
      setLabeLase(RES);
      return RES;
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
    (async () => {
      if (job.current.LabelaseLabelFormat || job.current.BarcodeLabelFormat) {
        const resPrinterLabels = await getPrinterLabels(job.current.BarcodeLabelFormat);
        const resLabeLase = await getLabeLase(job.current.LabelaseLabelFormat);

        if (job.current.LabelaseLabelFormat && !resLabeLase.length) {
          setError('LabeLaseTemplateID', {
            type: 'validate',
            message: '',
          });
        } else {
          clearErrors('LabeLaseTemplateID');
        }

        if (job.current.BarcodeLabelFormat && !resPrinterLabels.length) {
          setError('LabelNameID', {
            type: 'validate',
            message: '',
          });
        } else {
          clearErrors('LabelNameID');
        }
      } else {
        if (prefInfo.RawMaterialSettings) {
          setValue('LabeLaseTemplateID', prefInfo.RawMaterialSettings.LabeLaseTemplateID);
          if (!prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid) {
            setError('LabeLaseTemplateID', {
              type: 'validate',
              message: '',
            });
          }
          setValue('LabelNameID', prefInfo.RawMaterialSettings.LabelNameID);
          if (!prefInfo.RawMaterialDecor?.LabelName.IsValid) {
            setError('LabelNameID', {
              type: 'validate',
              message: '',
            });
          }
        }
      }
    })();
  }, [job.current]);

  return (
    <div>
      <div className="mt-5 flex-auto">
        <div className="mb-2">
          <Controller
            name="SendLabeltoBarTender"
            control={control}
            render={({ field }) => (
              <>
                <Checkbox
                  {...field}
                  inputId="SendLabeltoBarTender"
                  onChange={(e) => {
                    field.onChange(e.checked);
                    if (
                      !prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid &&
                      prefInfo.RawMaterialDecor?.LabeLaseTemplate.DisplayName !==
                        getValues().LabeLaseTemplateID
                    ) {
                      trigger('LabeLaseTemplateID');
                    }
                    if (
                      !prefInfo.RawMaterialDecor?.LabelName.IsValid &&
                      prefInfo.RawMaterialDecor?.LabelName.DisplayName !== getValues().LabelNameID
                    ) {
                      trigger('LabelNameID');
                    }
                  }}
                  disabled={!getValues().BarTenderInstalled || blockedAll}
                  checked={field.value}
                />
                <label htmlFor="SendLabeltoBarTender" className="ml-2">
                  {t('sts.chk.use.bartender')}
                </label>
              </>
            )}
          />
        </div>
        <div className="mb-2">
          <Controller
            name="UseLabeLasePrinter"
            control={control}
            render={({ field }) => (
              <>
                <Checkbox
                  {...field}
                  inputId="UseLabeLasePrinter"
                  disabled={!getValues()?.LabeLaseInstalled || blockedAll}
                  onChange={(e) => {
                    field.onChange(e.checked);
                    if (
                      !prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid &&
                      prefInfo.RawMaterialDecor?.LabeLaseTemplate.DisplayName !==
                        getValues().LabeLaseTemplateID
                    ) {
                      trigger('LabeLaseTemplateID');
                    }
                    if (
                      !prefInfo.RawMaterialDecor?.LabelName.IsValid &&
                      prefInfo.RawMaterialDecor?.LabelName.DisplayName !== getValues().LabelNameID
                    ) {
                      trigger('LabelNameID');
                    }
                    if (!e.checked) {
                      setValue('WriteTempFiletoLocal', false);
                    }
                  }}
                  checked={field.value}
                />
                <label htmlFor="UseLabeLasePrinter" className="ml-2">
                  {t('sts.chk.use.labelase')}
                </label>
              </>
            )}
          />
        </div>
        <div className="mb-2">
          <Controller
            name="WriteTempFiletoLocal"
            control={control}
            render={({ field }) => {
              return (
                <>
                  <Checkbox
                    {...field}
                    inputId="WriteTempFiletoLocal"
                    onChange={(e) => {
                      field.onChange(e.checked);
                      if (
                        !prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid &&
                        prefInfo.RawMaterialDecor?.LabeLaseTemplate.DisplayName !==
                          getValues().LabeLaseTemplateID
                      ) {
                        trigger('LabeLaseTemplateID');
                      }
                      if (
                        !prefInfo.RawMaterialDecor?.LabelName.IsValid &&
                        prefInfo.RawMaterialDecor?.LabelName.DisplayName !== getValues().LabelNameID
                      ) {
                        trigger('LabelNameID');
                      }
                    }}
                    disabled={!UseLabeLasePrinter || blockedAll}
                    checked={field.value}
                  />
                  <label htmlFor="WriteTempFiletoLocal" className="ml-2">
                    {t('sts.chk.use.local.dir')}
                  </label>
                </>
              );
            }}
          />
        </div>
        <div className="mt-5">
          <div>
            <div
              style={{ maxWidth: '50rem' }}
              className="flex align-items-center justify-content-between my-2"
            >
              <div className="w-6">{t('sts.label.parallel.printer.name')}:</div>
              <Controller
                name="PrinterNameID"
                control={control}
                render={({ field, fieldState }) => {
                  return (
                    <div style={{ width: 600 }}>
                      <AutoComplete
                        {...field}
                        virtualScrollerOptions={{
                          itemSize: DEFAULT_ROW_HEIGHT,
                        }}
                        itemTemplate={(value, index) => (
                          <DropdownItemTooltip id={`PrinterNameID_${index}`} label={value} />
                        )}
                        value={field.value?.DisplayName || field.value}
                        dropdown
                        disabled={blockedAll}
                        onFocus={(e) => {
                          if (!refPrinterName.current) {
                            refPrinterName.current = e.target.value;
                          }
                        }}
                        onSelect={(e) => {
                          field.onChange(e.value);
                          setValue('PrinterNameID', e.value);
                          refPrinterName.current = null;
                        }}
                        onBlur={(e) => {
                          setTimeout(() => {
                            if (
                              prefInfo.RawMaterialDecor?.PrinterName.DisplayName !==
                                e.target.value &&
                              !nameSuggestions.find((el) => el === e.target.value)
                            ) {
                              field.onChange(refPrinterName.current);
                              refPrinterName.current = null;
                            }
                          }, 100);
                        }}
                        field="label"
                        completeMethod={(e) => matchNames(e.query)}
                        suggestions={nameSuggestions}
                        className={classNames({
                          'w-full': true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORM_LOGON_ACCESS.fieldLength.LoginName}
                      />
                    </div>
                  );
                }}
              />
            </div>
          </div>
          <div
            style={{ maxWidth: '50rem' }}
            className="flex align-items-center justify-content-between my-2"
          >
            <div className="w-6">{t('sts.label.default.label.name')}:</div>
            <Controller
              name="LabelNameID"
              control={control}
              render={({ field, fieldState }) => {
                return (
                  <div style={{ width: 600 }}>
                    <AutoComplete
                      {...field}
                      virtualScrollerOptions={{
                        itemSize: DEFAULT_ROW_HEIGHT,
                      }}
                      itemTemplate={(value, index) => (
                        <DropdownItemTooltip id={`LabelNameID_${index}`} label={value} />
                      )}
                      dropdown
                      onChange={(e) => {
                        field.onChange(e.value);
                      }}
                      disabled={blockedAll}
                      onFocus={(e) => {
                        if (!refLabelName.current) {
                          refLabelName.current = e.target.value;
                        }
                      }}
                      onSelect={(e) => {
                        field.onChange(e.value);
                        setValue('LabelNameID', e.value);
                        refLabelName.current = null;
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (
                            prefInfo.RawMaterialDecor?.LabelName.DisplayName !== e.target.value &&
                            !labels.find((el) => el === e.target.value)
                          ) {
                            field.onChange(refLabelName.current);
                            refLabelName.current = null;
                          }
                        }, 100);
                      }}
                      completeMethod={(e) => getPrinterLabels(e.query)}
                      suggestions={labels}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={FORM_LOGON_ACCESS.fieldLength.LoginName}
                    />
                  </div>
                );
              }}
            />
          </div>
          <div
            style={{ maxWidth: '50rem' }}
            className="flex align-items-center justify-content-between my-2"
          >
            <div className="w-6">{t('table.label_destinations.labellase')}:</div>
            <Controller
              name="LabeLaseTemplateID"
              control={control}
              render={({ field, fieldState }) => {
                return (
                  <div style={{ width: 600 }}>
                    <AutoComplete
                      {...field}
                      virtualScrollerOptions={{
                        itemSize: DEFAULT_ROW_HEIGHT,
                      }}
                      itemTemplate={(value, index) => (
                        <DropdownItemTooltip id={`LabeLaseTemplateID_${index}`} label={value} />
                      )}
                      dropdown
                      disabled={blockedAll}
                      onChange={(e) => {
                        field.onChange(e.value);
                      }}
                      onFocus={(e) => {
                        if (!refLabeLase.current) {
                          refLabeLase.current = e.target.value;
                        }
                      }}
                      onSelect={(e) => {
                        field.onChange(e.value);
                        setValue('LabeLaseTemplateID', e.value);
                        refLabeLase.current = null;
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (
                            prefInfo.RawMaterialDecor?.LabeLaseTemplate.DisplayName !==
                              e.target.value &&
                            !labeLase.find((el) => el === e.target.value)
                          ) {
                            field.onChange(refLabeLase.current);
                            refLabeLase.current = null;
                          }
                        }, 100);
                      }}
                      completeMethod={(e) => getLabeLase(e.query)}
                      suggestions={labeLase}
                      className={classNames({
                        'w-full': true,
                        'p-invalid': fieldState.invalid,
                      })}
                      maxLength={FORM_LOGON_ACCESS.fieldLength.LoginName}
                    />
                  </div>
                );
              }}
            />
          </div>
          <div
            style={{ maxWidth: '50rem' }}
            className="flex align-items-center justify-content-between my-2"
          >
            <div className="w-6">{t('sts.label.local.temp.path')}:</div>
            <Controller
              name="PersonalPath"
              control={control}
              render={({ field }) => {
                return (
                  <div style={{ width: 600 }}>
                    <InputText disabled readOnly value={field.value} className="w-full" />
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrinterPrefs;
