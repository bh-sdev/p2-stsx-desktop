import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';

import { ScrollPanel } from 'primereact/scrollpanel';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

import { FORMS_CONFIG } from 'configs';
import { debounce, findNONE, trimStartEnd } from 'utils';
import { GlobalContext } from 'pages/Application';
import DropdownItemTooltip from 'components/DropdownItemTooltip';

import {
  createRawMaterial,
  getPrintedTable,
  removeTable,
  getJobNumbers,
  getRefControls,
  getRefLocations,
  getRefSerialNumbers,
  getRefMaterials,
  getRefHeats,
  checkPrinterSettings,
} from 'api/api.raw.materials';

import { confirmDialog } from 'primereact/confirmdialog';
import useWindowControl from 'hooks/useWindowControl';
import ROUTER_PATH from 'const/router.path';
import { removeEmptyParams } from 'api/general';
import { Dialog } from 'primereact/dialog';
import useActions from 'hooks/useActions';
import PrinterPrefs from './PrinterPrefs';
import moment from 'moment/moment';
import CustomInputMultiselect from 'components/CustomInputMultiselect';
import { DEFAULT_ROW_HEIGHT } from 'const';

const DEFAULT_CRITERIA = {
  JobID: '',
  Number: '',
  UseMaterialWildcards: false,
  ControlNumbers: [],
  SerialNumbers: [],
  Locations: [],
  Materials: [],
  Heats: [],
};

const DEFAULT_SELECTION_FOR = ['ControlNumbers', 'Heats'];

const PrinterFilters = ({ criteria, getCriteria }) => {
  const { sendPost, blockedAll } = useWindowControl(window.name);
  const { addHistoryLink, removeHistoryLink } = useActions();
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { control, setError, watch, handleSubmit, reset, setValue } = useForm({
    mode: 'onChange',
    defaultValues: criteria || DEFAULT_CRITERIA,
  });
  const [valid, setValid] = useState(true);
  const [creatingReport, setCreatingReport] = useState(false);

  const [prefInfo, setPrefsInfo] = useState({});
  const [resetFunction, setResetFunction] = useState(null);
  const [printerFormValues, getPrinterFormValues] = useState(null);
  const [loadingField, setLoadingField] = useState('');
  const [filtered, setFiltered] = useState('');
  const [rawData, setRawData] = useState({});
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const [refSuggestions, setRefSuggestions] = useState({});
  const [dirtyPrinter, setIsPrinterDirty] = useState(false);
  const refLocalSelectedJob = useRef({});
  const selectedJobRef = useRef({});
  const intervalReportID = useRef(null);
  const [printerValues, setPrinterValue] = useState(null);

  useEffect(() => {
    refLocalSelectedJob.current = selectedJobRef.current;
  }, []);

  const getButtonState = (valid) => {
    setValid(valid);
  };
  const watchFields = watch([
    'JobNumber',
    'UseMaterialWildcards',
    'ControlNumbers',
    'Heats',
    'SerialNumbers',
    'Locations',
    'Materials',
  ]);

  const isAnyFieldFilled =
    dirtyPrinter || watchFields.some((field) => (field?.length === 0 ? false : field));
  const setJob = (data) => {
    refLocalSelectedJob.current = data;
    selectedJobRef.current = data;
  };

  const clear = () => {
    reset(DEFAULT_CRITERIA);
    setJob({});
    selectedJobRef.current = {};
    setRefSuggestions({});
    getCriteria(null);
    setFiltered('');
    resetFunction({
      ...prefInfo,
      ...prefInfo['IDLabelSettings'],
      ...{ SendLabeltoBarTender: prefInfo.BarTenderInstalled },
      ...{
        UseLabeLasePrinter:
          prefInfo.LabeLaseInstalled && prefInfo.BarTenderInstalled
            ? false
            : prefInfo.LabeLaseInstalled,
      },
    });
  };

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await getJobNumbers({ prefix });
      setNumberSuggestions(Entries.map((data) => ({ label: data.Number, value: data })));
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

  const refreshExpiration = async (request, interval) => {
    try {
      const res = await request(rawData.ID, { Limit: 0, Offset: 0 });
      clearInterval(interval);
      interval = null;
      interval = setInterval(
        () => refreshExpiration(request, interval),
        moment(res.ExpireOn).diff(new Date(), 'milliseconds') - 60 * 1000,
      );
    } catch (e) {
      clearInterval(interval);
      interval = null;
    }
  };

  const setValuePrinter = (setValue) => {
    setPrinterValue(() => setValue);
  };

  useEffect(() => {
    if (rawData.Barcodes) {
      refreshExpiration(getPrintedTable, intervalReportID.current);
    }
    return () => {
      if (rawData.ID) {
        removeTable(rawData.ID);
      }
      if (rawData.Barcodes) {
        clearInterval(intervalReportID.current);
      }
    };
  }, [rawData]);

  const returnEmptyIfBrackets = (str) => (str === '{}' ? '' : str);

  const resetPref = (reset) => {
    setResetFunction(() => reset);
  };

  const getFormValues = (getValues) => {
    getPrinterFormValues(() => getValues);
  };

  const getIsDirty = (isDirty) => {
    setIsPrinterDirty(isDirty);
  };

  const onFiltersSend = async (data) => {
    if (!printerFormValues().SendLabeltoBarTender && !printerFormValues().UseLabeLasePrinter) {
      return confirmDialog({
        closable: false,
        message: t('1312'),
        header: '1312',
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
    const DATA = {};
    delete data.JobNumber;
    setCreatingReport(true);
    for (let key in data) {
      if (data[key] === '') continue;
      DATA[key] = returnEmptyIfBrackets(data[key]?.ID || data[key]);
    }
    for (let key in data) {
      if (Array.isArray(data[key]) && data[key].length) {
        DATA[key] = data[key].map(({ Name }) => returnEmptyIfBrackets(Name));
      }
    }

    try {
      const printerObject = {
        LabeLaseTemplate: printerFormValues().LabeLaseTemplateID,
        LabelName: printerFormValues().LabelNameID,
        PrinterName: printerFormValues().PrinterNameID.replace(' (default)', ''),
        UseBarTender: printerFormValues().SendLabeltoBarTender,
        UseLabeLase: printerFormValues().UseLabeLasePrinter,
        WriteTempFile: Boolean(printerFormValues().WriteTempFiletoLocal),
      };
      const preparedData = {
        ...DATA,
        PrinterID: printerFormValues().PrinterNameValue,
        FilePath: printerFormValues().PersonalPath,
      };
      await checkPrinterSettings(printerObject);
      const res = await createRawMaterial(removeEmptyParams(preparedData));
      setFiltered(res.Barcodes);
      setRawData(res);
      const params = new URLSearchParams(printerObject).toString();
      addHistoryLink({
        title: t('sts.btn.print.selected'),
        path: `${window.origin}/${ROUTER_PATH.rawMaterialLabels}/${ROUTER_PATH.printSelected}/${res.ID}?${params}`,
        parentID: `${window.origin}/${ROUTER_PATH.rawMaterialLabels}`,
        removeHistoryLink,
      });
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          setJob({});
          setValue('JobID', '');
          setValue('JobNumber', '');
          setError('JobNumber', {
            type: 'validate',
            message: '',
          });
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setCreatingReport(false);
    }
    sendPost({ customData: data });
  };
  const jobNumberFieldFlow = (data) => {
    if (!data) {
      clear();
      return;
    }
    const MATCHED = numberSuggestions.find(({ label }) => label === (data.label || data));
    if (MATCHED) {
      setJob(MATCHED.value);
      reset({ ...DEFAULT_CRITERIA, JobID: MATCHED.value.ID, JobNumber: MATCHED.label });
      setValue('JobID', MATCHED.value.ID);

      if (MATCHED.value.BarcodeLabelFormat && !findNONE(MATCHED.value.BarcodeLabelFormat)) {
        printerValues('LabelNameID', MATCHED.value.BarcodeLabelFormat);
      }
      if (MATCHED.value.LabelaseLabelFormat && !findNONE(MATCHED.value.LabelaseLabelFormat)) {
        printerValues('LabeLaseTemplateID', MATCHED.value.LabelaseLabelFormat);
      }
      setRefSuggestions({});
    } else {
      confirmDialog({
        closable: false,
        message: t('1217'),
        header: t('1217'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          setJob({});
          setValue('JobID', '');
          setValue('JobNumber', '');
          setError('JobNumber', {
            type: 'validate',
            message: '',
          });
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };
  const refMatch = debounce(async (ID, request) => {
    setLoadingField(ID);
    try {
      const { Entries } = await request({ job_id: selectedJobRef.current.ID });
      setRefSuggestions({
        ...refSuggestions,
        [ID]: Entries,
      });
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    } finally {
      setLoadingField('');
    }
  }, 100);

  const getRefSuggestions = (ID) =>
    [...(refSuggestions[ID] || [])].map((data) =>
      typeof data === 'string' ? { Name: data, ID: data } : data,
    );

  const RenderMultiSelect = ({ ID, field, type = 'string', request, mr = false }) => (
    <CustomInputMultiselect
      {...field}
      multiWithoutCtrl
      caps
      field="Name"
      type={type}
      disabled={blockedAll}
      loading={loadingField === ID}
      completeMethod={(value) => refMatch(ID, request, { prefix: value })}
      customSuggestionsStart={DEFAULT_SELECTION_FOR.includes(ID) ? [{ Name: '{}', ID: '{}' }] : []}
      suggestions={getRefSuggestions(ID)}
      shouldCompleteMethodSend={!refSuggestions[ID]}
      itemTemplate={(value, index) => (
        <DropdownItemTooltip id={`${ID}_${index}`} label={value.Name} />
      )}
      className={classNames({
        'w-full': true,
        'mr-2': mr,
      })}
    />
  );

  return (
    <div className="h-full flex flex-column fadein printers-prefs">
      <Dialog visible={creatingReport} style={{ minWidth: 400, height: 100 }} closable={false}>
        {t('sts.txt.collecting.info')}...
      </Dialog>
      <div className="flex-auto flex flex-column disabled">
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
              <div className="flex-auto">
                <div className="fadein grid column-gap-5 grid-nogutter">
                  <div style={{ width: '39rem' }}>
                    <div className="my-1">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.job.number')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="JobNumber"
                            control={control}
                            render={({ field }) => {
                              return (
                                <AutoComplete
                                  {...field}
                                  disabled={blockedAll}
                                  virtualScrollerOptions={{
                                    itemSize: DEFAULT_ROW_HEIGHT,
                                  }}
                                  itemTemplate={(value, index) => (
                                    <DropdownItemTooltip
                                      id={`Number_${index}`}
                                      label={value.label}
                                    />
                                  )}
                                  dropdown
                                  onSelect={(e) => {
                                    if (selectedJobRef.current.Number !== e.value.label) {
                                      jobNumberFieldFlow(e.value, field);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    setTimeout(() => {
                                      if (selectedJobRef.current.Number !== e.target.value) {
                                        field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                        jobNumberFieldFlow(
                                          trimStartEnd(e.target.value.toUpperCase()),
                                          field,
                                        );
                                      }
                                    }, 400);
                                  }}
                                  onChange={(e) => {
                                    field.onChange((e.value?.label || e.value).toUpperCase());
                                  }}
                                  autoHighlight
                                  completeMethod={(event) => matchNumber(event.query)}
                                  suggestions={numberSuggestions}
                                  className={classNames({
                                    'w-full': true,
                                  })}
                                  maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Number}
                                />
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex align-items-center mb-1">
                      <div className="mr-4 w-10rem">{t('sts.label.job.title')}:</div>
                      <div className="w-full">
                        <InputText
                          disabled
                          readOnly
                          value={refLocalSelectedJob.current.Title || ''}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex align-items-center mb-1">
                      <div className="mr-4 w-10rem">{t('sts.label.customer.number')}:</div>
                      <div className="w-full">
                        <InputText
                          disabled
                          readOnly
                          value={refLocalSelectedJob.current.CustomerNumber || ''}
                          className={classNames({
                            'w-full': true,
                          })}
                          style={{ flexShrink: 0 }}
                        />
                      </div>
                    </div>

                    <div className="flex align-items-center mb-1">
                      <div className="mr-4 w-10rem">{t('sts.label.customer.name')}:</div>
                      <div className="w-full">
                        <InputText
                          disabled
                          readOnly
                          value={refLocalSelectedJob.current.CustomerName || ''}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      </div>
                    </div>

                    <div className="flex align-items-end mb-1">
                      <div className="mr-4 w-10rem">{t('sts.label.filtered.items')}:</div>
                      <div className="w-full">
                        <InputText
                          disabled={true}
                          value={filtered}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      </div>
                    </div>

                    <div className="">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.control.number')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="ControlNumbers"
                            control={control}
                            render={({ field }) =>
                              RenderMultiSelect({
                                ID: 'ControlNumbers',
                                field,
                                request: getRefControls,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="my-1">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.material')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="Materials"
                            control={control}
                            render={({ field }) =>
                              RenderMultiSelect({
                                ID: 'Materials',
                                field,
                                request: getRefMaterials,
                              })
                            }
                          />
                          <Controller
                            name="UseMaterialWildcards"
                            control={control}
                            render={({ field }) => (
                              <div className="flex-shrink-0 ml-2 flex align-items-center justify-content-end">
                                <Checkbox
                                  {...field}
                                  disabled={blockedAll}
                                  inputId="UseMaterialWildcards"
                                  checked={field.value}
                                />
                                <label
                                  htmlFor="UseMaterialWildcards"
                                  className="ml-2 cursor-pointer"
                                >
                                  {t('sts.chk.use.wildcards')}
                                </label>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="my-1">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.serial.number')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="SerialNumbers"
                            control={control}
                            render={({ field }) =>
                              RenderMultiSelect({
                                ID: 'SerialNumbers',
                                field,
                                request: getRefSerialNumbers,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="my-1">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.location')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="Locations"
                            control={control}
                            render={({ field }) =>
                              RenderMultiSelect({
                                ID: 'Locations',
                                field,
                                request: getRefLocations,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="my-1">
                      <div className="flex align-items-center">
                        <div className="mr-4 w-10rem">{t('sts.label.heat')}:</div>
                        <div className="flex align-items-center w-full">
                          <Controller
                            name="Heats"
                            control={control}
                            render={({ field }) =>
                              RenderMultiSelect({
                                ID: 'Heats',
                                field,
                                request: getRefHeats,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <PrinterPrefs
                  getButtonState={getButtonState}
                  setPrefsInfo={setPrefsInfo}
                  prefInfo={prefInfo}
                  resetPref={resetPref}
                  setPrinterValue={setValuePrinter}
                  getPrinterFormValues={getFormValues}
                  getIsDirty={getIsDirty}
                  job={selectedJobRef}
                />
              </div>
            </ScrollPanel>
          )}
        </AutoSizer>
        <div className="flex justify-content-end gap-2 mt-3 p-2">
          <Button
            disabled={blockedAll || !valid || loadingField}
            label={t('sts.btn.print.selected')}
            size="small"
            onClick={handleSubmit(onFiltersSend)}
          />
          <Button
            disabled={blockedAll || !isAnyFieldFilled}
            label={t('sts.btn.clear')}
            size="small"
            onClick={clear}
          />
          <Button
            disabled={blockedAll}
            label={t('sts.btn.close')}
            size="small"
            onClick={window.close}
          />
        </div>
      </div>
    </div>
  );
};

export default PrinterFilters;
