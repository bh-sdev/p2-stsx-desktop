import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';

import { ScrollPanel } from 'primereact/scrollpanel';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

import { FORMS_CONFIG } from 'configs';
import { debounce, trimStartEnd } from 'utils';
import { GlobalContext } from 'pages/Application';
import DropdownItemTooltip from 'components/DropdownItemTooltip';

import {
  createReport,
  loadRefBatches,
  loadRefBundleNumbers,
  loadRefCowCodes,
  loadRefJobs,
  loadRefLoadNumbers,
  loadRefLoadReleases,
  loadRefLocations,
  loadRefLotNumbers,
  loadRefPcReleases,
  loadRefPiecemarks,
  loadRefPkgNumbers,
  loadRefSequenceNumbers,
  loadRefSerialNumbers,
  loadRefSheetNumbers,
  loadRefShopOrderNumbers,
  loadRefStatuses,
} from 'api/api.delActiveRecords';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import useActions from 'hooks/useActions';
import ROUTER_PATH from 'const/router.path';
import useWindowControl from 'hooks/useWindowControl';
import CustomInputMultiselect from 'components/CustomInputMultiselect';
import { DEFAULT_ROW_HEIGHT } from 'const';

const ViewLoadsCriteriaValidationSchema = yup.object({
  Number: yup.string().required(),
  JobID: yup.string().required(),
});

const DEFAULT_CRITERIA = {
  HideEmptyColumns: false,
  Batches: [],
  Bundles: [],
  COWCodes: [],
  IncludeMinorMarks: false,
  JobID: '',
  IdSerialIDs: [],
  LoadIDs: [],
  LoadReleases: [],
  Locations: [],
  Lots: [],
  PackageNumbers: [],
  PieceReleases: [],
  Piecemarks: [],
  Sequences: [],
  Sheets: [],
  ShopOrders: [],
  StatusDescriptionIDs: [],
  Number: '',
};

const DEFAULT_LOADED_INFO = {
  Barcodes: 0,
  ExpireOn: null,
  ID: null,
  Piecemarks: 0,
  Pieces: 0,
  WeightKg: 0,
  WeightLbs: 0,
};
// Status, Bndl #, load #, Location, Seq and Lot  #
const DEFAULT_SELECTION_FOR = [
  'StatusDescriptionIDs',
  'Bundles',
  'Lots',
  'Locations',
  'Sequences',
  'LoadIDs',
];

const ViewPiecmarks = ({
  selectedJob,
  getSelectedJob,
  loadedInfo,
  getLoadedInfo,
  criteria,
  getCriteria,
  refSuggestions,
  setRefSuggestions,
}) => {
  const { blockedAll, receivedData } = useWindowControl(window.name, false);
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const { addHistoryLink, removeHistoryLink } = useActions();
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    formState: { isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: criteria || DEFAULT_CRITERIA,
    resolver: yupResolver(ViewLoadsCriteriaValidationSchema),
  });

  const [creatingReport, setCreatingReport] = useState(false);
  const [progress, setProgress] = useState(false);
  const [loadingField, setLoadingField] = useState('');
  const [numberSuggestions, setNumberSuggestions] = useState([]);

  const refLocalSelectedJob = useRef({});

  useEffect(() => {
    refLocalSelectedJob.current = selectedJob;
  }, []);
  useEffect(() => {
    if (receivedData?.refetch) {
      getInformation(criteria);
    }
  }, [receivedData]);
  const setJob = (data) => {
    refLocalSelectedJob.current = data;
    getSelectedJob(data);
  };

  const returnEmptyIfBrackets = (str) => (str === '{}' ? '' : str);

  const getInformation = async (data) => {
    getCriteria(data);
    const DATA = {};
    for (let key in data) {
      if (data[key] === '') continue;
      DATA[key] = returnEmptyIfBrackets(data[key].ID || data[key]);
    }
    for (let key in data) {
      if (Array.isArray(data[key]) && data[key].length) {
        DATA[key] = data[key].map(({ Name, ID }) =>
          returnEmptyIfBrackets(key.includes('ID') ? ID : Name),
        );
      }
    }

    try {
      setCreatingReport(true);
      const res = await createReport(DATA);
      getLoadedInfo(res);
      setProgress(null);
      reset(data);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setCreatingReport(false);
    }
  };

  const clear = () => {
    reset(DEFAULT_CRITERIA);
    setJob({});
    getCriteria(null);
    getLoadedInfo(DEFAULT_LOADED_INFO);
    setRefSuggestions({});
  };

  const selectDeletion = ({ HideEmptyColumns, JobID }) => {
    addHistoryLink({
      title: t('sts.txt.job.piecemark.delete'),
      path: `${window.origin}/${ROUTER_PATH.activeRecordDeletes}/${loadedInfo.ID}?hideEmptyCols=${
        HideEmptyColumns || ''
      }&jobID=${JobID}`,
      parentID: `${window.origin}/${ROUTER_PATH.viewLoadInformation}`,
      removeHistoryLink,
    });
  };

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await loadRefJobs({ include_closed: true, prefix });
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

  const jobNumberFieldFlow = (data) => {
    if (!data) {
      clear();
      return;
    }
    const MATCHED = numberSuggestions.find(({ label }) => label === (data.label || data));
    if (MATCHED) {
      setJob(MATCHED.value);
      reset({ ...DEFAULT_CRITERIA, JobID: MATCHED.value.ID, Number: MATCHED.label });
      setRefSuggestions({});
      getLoadedInfo({});
    } else {
      confirmDialog({
        closable: false,
        message: t('1217'),
        header: t('1217'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          setJob({});
          setValue('JobID', '');
          setValue('Number', '');
          setError('Number', {
            type: 'validate',
            message: '',
          });
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const refMatch = debounce(async (ID, request, params) => {
    setLoadingField(ID);
    try {
      const { Entries } = await request({ job_id: selectedJob.ID, ...params });
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

  const RenderMultiSelect = ({
    ID,
    field,
    type = 'string',
    request,
    mr = false,
    width = 'w-30rem',
  }) => (
    <CustomInputMultiselect
      {...field}
      multiWithoutCtrl
      caps
      field="Name"
      type={type}
      disabled={!selectedJob.ID || blockedAll}
      loading={loadingField === ID}
      completeMethod={(value) => refMatch(ID, request, { prefix: value })}
      customSuggestionsStart={DEFAULT_SELECTION_FOR.includes(ID) ? [{ Name: '{}', ID: '{}' }] : []}
      suggestions={getRefSuggestions(ID)}
      shouldCompleteMethodSend={!refSuggestions[ID]}
      itemTemplate={(value, index) => (
        <DropdownItemTooltip id={`${ID}_${index}`} label={value.Name} />
      )}
      className={classNames({
        [width]: true,
        'mr-2': mr,
      })}
    />
  );

  return (
    <div className="h-full flex flex-column fadein">
      <Dialog visible={creatingReport} style={{ minWidth: 400, height: 100 }} closable={false}>
        {!progress ? `${t('sts.txt.collecting.info')}...` : <p className="m-0">{progress}</p>}
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
                <form
                  onSubmit={handleSubmit(() => {})}
                  className="p-fluid"
                  style={{ width: 700, maxWidth: '100%' }}
                >
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.job.number')}:</div>
                    <div className="w-30rem">
                      <Controller
                        name="Number"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            disabled={blockedAll}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`Number_${index}`} label={value.label} />
                            )}
                            dropdown
                            onSelect={(e) => {
                              if (refLocalSelectedJob.current.Number !== e.value.label) {
                                jobNumberFieldFlow(e.value);
                              }
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                if (refLocalSelectedJob.current.Number !== e.target.value) {
                                  field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                  jobNumberFieldFlow(trimStartEnd(e.target.value.toUpperCase()));
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
                              required: true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_JOB.fieldLength.Number}
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.job.title')}:</div>
                    <div className=" w-30rem">
                      <InputText
                        disabled
                        readOnly
                        value={refLocalSelectedJob.current.Title || ''}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.customer.number')}:</div>
                    <div className="w-30rem">
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

                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.customer.name')}:</div>
                    <div className="w-30rem">
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

                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.location')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="Locations"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'Locations',
                            field,
                            request: loadRefLocations,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <Controller
                        name="HideEmptyColumns"
                        control={control}
                        render={({ field }) => (
                          <div className="w-full flex align-items-center w-15rem">
                            <Checkbox
                              {...field}
                              disabled={!refLocalSelectedJob.current.ID || blockedAll}
                              inputId="HideEmptyColumns"
                              checked={field.value}
                            />
                            <label htmlFor="HideEmptyColumns" className="ml-2 cursor-pointer">
                              {t('sts.chk.hide.empty.columns')}
                            </label>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.piecemark.parent')}:</div>
                    <Controller
                      name="Piecemarks"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'Piecemarks',
                          field,
                          request: loadRefPiecemarks,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.status')}:</div>
                    <Controller
                      name="StatusDescriptionIDs"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'StatusDescriptionIDs',
                          field,
                          request: loadRefStatuses,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.sheet.num')}:</div>
                    <Controller
                      name="Sheets"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'Sheets',
                          field,
                          request: loadRefSheetNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.seq.num')}:</div>
                    <Controller
                      name="Sequences"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'Sequences',
                          field,
                          request: loadRefSequenceNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.lot.num')}:</div>
                    <Controller
                      name="Lots"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'Lots',
                          field,
                          request: loadRefLotNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.bundle.num')}:</div>
                    <Controller
                      name="Bundles"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'Bundles',
                          field,
                          request: loadRefBundleNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.load.num')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="LoadIDs"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'LoadIDs',
                            field,
                            request: loadRefLoadNumbers,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.load.release')}:</div>
                    <div className="flex align-items-center">
                      <Controller
                        name="LoadReleases"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'LoadReleases',
                            field,
                            request: loadRefLoadReleases,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <Controller
                        name="IncludeMinorMarks"
                        control={control}
                        render={({ field }) => (
                          <div className="w-full flex align-items-center w-15rem">
                            <Checkbox
                              {...field}
                              disabled={!refLocalSelectedJob.current.ID || blockedAll}
                              inputId="IncludeMinorMarks"
                              checked={field.value}
                            />
                            <label htmlFor="IncludeMinorMarks" className="ml-2 cursor-pointer">
                              {t('sts.chk.include.minor.marks')}
                            </label>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.shop.order.number')}:</div>
                    <Controller
                      name="ShopOrders"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'ShopOrders',
                          field,
                          request: loadRefShopOrderNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.number.id')}:</div>
                    <Controller
                      name="IdSerialIDs"
                      control={control}
                      render={({ field }) =>
                        RenderMultiSelect({
                          ID: 'IdSerialIDs',
                          field,
                          request: loadRefSerialNumbers,
                        })
                      }
                    />
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.piecemark.release')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="PieceReleases"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'PieceReleases',
                            field,
                            request: loadRefPcReleases,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <div className="flex align-items-center justify-content-between w-15rem">
                        <span>{t('sts.label.barcode.id.numbers')}:</span>
                        <span>{loadedInfo.Barcodes || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.package.number')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="PackageNumbers"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'PackageNumbers',
                            field,
                            type: 'number',
                            request: loadRefPkgNumbers,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <div className="flex align-items-center justify-content-between w-15rem">
                        <span>{t('sts.label.total.pieces')}:</span>
                        <span>{loadedInfo.Pieces || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.batch')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="Batches"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'Batches',
                            field,
                            request: loadRefBatches,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <div className="flex align-items-center justify-content-between w-15rem">
                        <span>{t('sts.label.total.weight')}:</span>
                        <span>
                          {loadedInfo.Weight || 0} {loadedInfo.WeightMeasure}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex align-items-center mb-2">
                    <div className="mr-4 w-3">{t('sts.label.cow.code')}:</div>
                    <div className="flex align-items-center w-30rem">
                      <Controller
                        name="COWCodes"
                        control={control}
                        render={({ field }) =>
                          RenderMultiSelect({
                            ID: 'COWCodes',
                            field,
                            request: loadRefCowCodes,
                            mr: true,
                            width: 'w-15rem',
                          })
                        }
                      />
                      <div className="flex align-items-center justify-content-between w-15rem">
                        <span>{t('sts.label.number.of.piecemarks')}:</span>
                        <span>{loadedInfo.Piecemarks || 0}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </ScrollPanel>
          )}
        </AutoSizer>
        <div className="flex justify-content-end gap-2 mt-3 mb-2">
          <Button
            disabled={!isValid || !getValues().Number || blockedAll || loadingField}
            label={t('sts.btn.get.information')}
            size="small"
            onClick={handleSubmit(getInformation)}
          />
          <Button
            disabled={!loadedInfo.ID || blockedAll}
            label={t('sts.btn.record.selection.deletion')}
            size="small"
            onClick={handleSubmit(selectDeletion)}
          />
          <Button disabled={blockedAll} label={t('sts.btn.clear')} size="small" onClick={clear} />
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

export default ViewPiecmarks;
