import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { Checkbox } from 'primereact/checkbox';
import * as yup from 'yup';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { RadioButton } from 'primereact/radiobutton';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  getLabels,
  getLocalPaths,
  getPrefs,
  getPrinterLabelLase,
  getPrinterNames,
  updatePrefs,
} from 'api/api.barcode';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { FORM_LOGON_ACCESS } from '../../../../configs/forms.config';
import { GlobalContext } from '../../index';
import { Button } from 'primereact/button';
import { noSpaceOnStart, searchInArray } from '../../../../utils';
import { removeEmptyParams } from '../../../../api/general';
import { confirmDialog } from 'primereact/confirmdialog';
import { yupResolver } from '@hookform/resolvers/yup';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import { Dropdown } from 'primereact/dropdown';
import { DEFAULT_ROW_HEIGHT } from 'const';

const BarCodeValidationSchema = yup.object({
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

    return yup.string().when('BarTenderInstalled', {
      is: true,
      then: (schema) => schema.required().notOneOf(['<None>']),
    });
  }),
  LabeLaseTemplateID: yup.lazy((value) => {
    if (value === '') {
      return yup.string().when('LabeLaseInstalled', {
        is: true,
        then: (schema) => schema.required().notOneOf(['<None>']),
      });
    }

    return yup.string().when('LabeLaseInstalled', {
      is: true,
      then: (schema) => schema.required().notOneOf(['<None>']),
    });
  }),
});

const BarCodePrinterPrefs = () => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [prefInfo, setPrefsInfo] = useState({});
  const [isDirtyForm, setFormDitry] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [labels, setPrinterLabels] = useState([]);
  const [labeLase, setLabeLase] = useState([]);
  const [localPath, setLocalPathValue] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const refPrinters = useRef([]);
  const refPrinterName = useRef(null);
  const refLabelName = useRef(null);
  const refLabeLase = useRef(null);
  const { Edit } = useGetPermissions(ScreenId.barCodePrinterPrefs);
  const [radioButtonValue, setRadioButtonValue] = useState('IDLabelSettings');
  const [busy, setIsBusy] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    setError,
    formState: { isValid, isDirty, errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: async () => {
      const res = await getPrefs();
      return {
        ...res,
        ...res[radioButtonValue],
      };
    },
    resolver: yupResolver(BarCodeValidationSchema),
  });
  const keyDecor = radioButtonValue === 'IDLabelSettings' ? 'IDLabelDecor' : 'RawMaterialDecor';
  const fetchPrefs = async () => {
    const path = await getLocalPaths();
    const res = await getPrefs();
    setPrefsInfo(res);
    setLocalPathValue(path.Entries);
  };
  useEffect(() => {
    fetchPrefs();
  }, []);

  const getId = (array) => array.map((item) => item.ID);

  useEffect(() => {
    if (prefInfo && prefInfo.IDLabelDecor) {
      if (radioButtonValue === 'IDLabelSettings') {
        if (
          (prefInfo.IDLabelDecor?.PrinterName.DisplayName ===
            prefInfo.IDLabelSettings.PrinterNameID &&
            !prefInfo.IDLabelDecor?.PrinterName.IsValid) ||
          (!prefInfo.IDLabelDecor?.PrinterName.IsValid && !isEdit)
        ) {
          setError('PrinterNameID', {
            type: 'validate',
            message: '',
          });
        }
        if (
          (prefInfo.IDLabelDecor?.LabelName.DisplayName === prefInfo.IDLabelSettings.LabelNameID &&
            !prefInfo.IDLabelDecor?.LabelName.IsValid) ||
          (!prefInfo.IDLabelDecor?.LabelName.IsValid && !isEdit)
        ) {
          setError('LabelNameID', {
            type: 'validate',
            message: '',
          });
        }
        if (
          (prefInfo.IDLabelDecor?.LabeLaseTemplate.DisplayName ===
            prefInfo.IDLabelSettings.LabeLaseTemplateID &&
            !prefInfo.IDLabelDecor?.LabeLaseTemplate.IsValid) ||
          (!prefInfo.IDLabelDecor?.LabeLaseTemplate.IsValid && !isEdit)
        ) {
          setError('LabeLaseTemplateID', {
            type: 'validate',
            message: '',
          });
        }
      } else if (radioButtonValue === 'RawMaterialSettings') {
        if (
          (prefInfo.RawMaterialDecor?.PrinterName.DisplayName ===
            prefInfo.RawMaterialSettings.PrinterNameID &&
            !prefInfo.RawMaterialDecor?.PrinterName.IsValid) ||
          (!prefInfo.RawMaterialDecor?.PrinterName.IsValid && !isEdit)
        ) {
          setError('PrinterNameID', {
            type: 'validate',
            message: '',
          });
        }
        if (
          (prefInfo.RawMaterialDecor?.LabelName.DisplayName ===
            prefInfo.RawMaterialSettings.LabelNameID &&
            !prefInfo.RawMaterialDecor?.LabelName.IsValid) ||
          (!prefInfo.RawMaterialDecor?.LabelName.IsValid && !isEdit)
        ) {
          setError('LabelNameID', {
            type: 'validate',
            message: '',
          });
        }
        if (
          (prefInfo.RawMaterialDecor?.LabeLaseTemplate.DisplayName ===
            prefInfo.RawMaterialSettings.LabeLaseTemplateID &&
            !prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid) ||
          (!prefInfo.RawMaterialDecor?.LabeLaseTemplate.IsValid && !isEdit)
        ) {
          setError('LabeLaseTemplateID', {
            type: 'validate',
            message: '',
          });
        }
      }
    }
  }, [prefInfo, errors, radioButtonValue, isEdit]);

  useEffect(() => {
    setTimeout(() => reset({ ...getValues(), ...prefInfo[radioButtonValue] }), 100);
  }, [radioButtonValue]);

  const handleRadioChange = (e) => {
    setRadioButtonValue(e.value);
  };
  useEffect(() => {
    if (isDirty) {
      setFormDitry(true);
    }
  }, [isDirty]);
  const matchNames = async (query) => {
    try {
      const { Entries } = await getPrinterNames();
      refPrinters.current = Entries;
      setNameSuggestions(searchInArray(getId(Entries), query));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };
  const update = async () => {
    const preparedData = {
      ...prefInfo,
      BarTenderInstalled: getValues().BarTenderInstalled,
      LabeLaseInstalled: getValues().LabeLaseInstalled,
      LabelMatrixInstalled: getValues().LabelMatrixInstalled,
      PersonalPath: getValues().PersonalPath,
    };
    try {
      setIsBusy(true);
      await updatePrefs(noSpaceOnStart(removeEmptyParams(preparedData)));
      await fetchPrefs();
      trigger(['PrinterNameID', 'LabelNameID', 'LabeLaseTemplateID']);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.barcode.updated'),
        header: t('sts.txt.barcode.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: t('sts.txt.bar.code'),
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const getPrinterLabels = async (query) => {
    try {
      const { Entries } = await getLabels();
      setPrinterLabels(
        searchInArray(
          getId([{ ID: t('sts.status.noneTr'), Name: t('sts.status.noneTr') }, ...Entries]),
          query,
        ),
      );
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
      const { Entries } = await getPrinterLabelLase();
      setLabeLase(
        searchInArray(
          getId([{ ID: t('sts.status.noneTr'), Name: t('sts.status.noneTr') }, ...Entries]),
          query,
        ),
      );
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  return !Object.keys(prefInfo).length ? null : (
    <div className="p-splitter p-component flex flex-column h-full  p-3">
      <div className="flex justify-content-between align-items-center">
        <div />
        <GoToRootWindow />
      </div>
      <div className="p-3 flex-auto printers-prefs">
        <div className="mb-2">
          <Controller
            name="LabeLaseInstalled"
            control={control}
            render={({ field }) => (
              <>
                <Checkbox
                  disabled={!isEdit}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    trigger('LabeLaseTemplateID');
                  }}
                  inputId="LabeLaseInstalled"
                  checked={field.value}
                />
                <label htmlFor="LabeLaseInstalled" className="ml-2">
                  {t('sts.txt.label.lase.printer.installed')}
                </label>
              </>
            )}
          />
        </div>
        <div className="mb-2">
          <Controller
            name="BarTenderInstalled"
            control={control}
            render={({ field }) => (
              <>
                <Checkbox
                  disabled={!isEdit}
                  {...field}
                  inputId="BarTenderInstalled"
                  checked={field.value}
                />
                <label htmlFor="BarTenderInstalled" className="ml-2">
                  {t('sts.txt.bartender.installed')}
                </label>
              </>
            )}
          />
        </div>
        <div className="mb-2">
          <Controller
            name="LabelMatrixInstalled"
            control={control}
            render={({ field }) => {
              return (
                <>
                  <Checkbox
                    disabled={!isEdit}
                    {...field}
                    inputId="LabelMatrixInstalled"
                    checked={field.value}
                  />
                  <label htmlFor="LabelMatrixInstalled" className="ml-2">
                    {t('sts.txt.label.matrix.installed')}
                  </label>
                </>
              );
            }}
          />
        </div>
        <div className="">
          <div>
            <Controller
              name="BarcodePreambleLength"
              control={control}
              render={() => (
                <div className="flex mt-8 flex-column flex-wrap gap-2 w-full">
                  <div>
                    <RadioButton
                      inputId="IDLabelSettings"
                      name="IDLabelSettings"
                      value="IDLabelSettings"
                      onChange={handleRadioChange}
                      checked={radioButtonValue === 'IDLabelSettings'}
                    />
                    <label htmlFor="IDLabelSettings" className="ml-2">
                      {t('sts.txt.id.label.default')}
                    </label>
                  </div>
                  <div>
                    <RadioButton
                      inputId="RawMaterialSettings"
                      name="RawMaterialSettings"
                      value="RawMaterialSettings"
                      onChange={handleRadioChange}
                      checked={radioButtonValue === 'RawMaterialSettings'}
                    />
                    <label htmlFor="RawMaterialSettings" className="ml-2">
                      {t('sts.txt.part.label.default')}
                    </label>
                  </div>
                </div>
              )}
            />
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
                          <DropdownItemTooltip
                            id={`PrinterNameID_${index}`}
                            label={`${value}${
                              refPrinters.current.find(({ ID }) => ID === value)?.IsDefault
                                ? ' (Default)'
                                : ''
                            }`}
                          />
                        )}
                        disabled={!isEdit}
                        value={field.value?.DisplayName || field.value}
                        dropdown
                        onFocus={(e) => {
                          if (!refPrinterName.current) {
                            refPrinterName.current = e.target.value;
                          }
                        }}
                        onSelect={(e) => {
                          field.onChange(e.value);
                          setValue('PrinterNameID', e.value);
                          setPrefsInfo({
                            ...prefInfo,
                            [radioButtonValue]: {
                              ...prefInfo[radioButtonValue],
                              PrinterNameID: e.value,
                            },
                          });
                          refPrinterName.current = null;
                        }}
                        onBlur={(e) => {
                          setTimeout(() => {
                            if (
                              prefInfo.IDLabelDecor?.PrinterName.DisplayName !== e.target.value &&
                              !nameSuggestions.find((el) => el === e.target.value)
                            ) {
                              field.onChange(refLabelName.current);
                              refLabelName.current = null;
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
                      disabled={!isEdit}
                      dropdown
                      onChange={(e) => {
                        field.onChange(e.value);
                      }}
                      onFocus={(e) => {
                        if (!refLabelName.current) {
                          refLabelName.current = e.target.value;
                        }
                      }}
                      onSelect={(e) => {
                        field.onChange(e.value);
                        setValue('LabelNameID', e.value);
                        setPrefsInfo({
                          ...prefInfo,
                          [radioButtonValue]: {
                            ...prefInfo[radioButtonValue],
                            LabelNameID: e.value,
                          },
                        });
                        refLabelName.current = null;
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (
                            prefInfo[keyDecor]?.LabelName.DisplayName !== e.target.value &&
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
                      disabled={!isEdit}
                      dropdown
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
                        setPrefsInfo({
                          ...prefInfo,
                          [radioButtonValue]: {
                            ...prefInfo[radioButtonValue],
                            LabeLaseTemplateID: e.value,
                          },
                        });
                        refLabeLase.current = null;
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (
                            prefInfo[keyDecor]?.LabeLaseTemplate.DisplayName !== e.target.value &&
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
                  <Dropdown
                    {...field}
                    disabled={!isEdit}
                    options={localPath?.map(({ ID, Name }) => ({
                      label: Name,
                      value: ID,
                    }))}
                    optionValue="value"
                    className={classNames({ 'w-full': true })}
                  />
                );
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-content-end gap-2 mt-5">
        {isEdit ? (
          <>
            <Button
              disabled={!isValid || !isDirtyForm}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                reset({});
                setIsEdit(false);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            disabled={!Edit}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default BarCodePrinterPrefs;
