import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';

import { kissJobNumbers, kissJobById, kissImport, uploadKissFile } from 'api/api.kiss';
import { API_CONFIG, FORMS_CONFIG } from 'configs';
import ENDPOINTS from 'const/endpoints';
import ServiceUserStorage from 'services/ServiceUserStorage';
import { trimStartEnd } from 'utils';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';

import SelectionFile from './SelectionFile';
import { ServiceTokenStorage } from 'services';
import { DEFAULT_ROW_HEIGHT } from 'const';

const RouterValidationSchema = yup.object({
  JobID: yup.string().required(),
  JobNumber: yup.string().required(),
});

const EMPTY_FILTER = {
  FileName: '',
  JobID: '',
  FilterLotNumbers: '',
  FilterPieceMarks: '',
  FilterSequences: '',
  FilterSheetNumbers: '',
  LocalFile: false,
  SkipJobValidation: false,
  SkipTeklaValidation: false,
};

const KissImport = ({ success }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
    defaultValues: EMPTY_FILTER,
    resolver: yupResolver(RouterValidationSchema),
  });
  const [numberSuggestions, setNumberSuggestions] = useState([]);
  const [isSelectionFileOpen, setIsSelectionFileOpen] = useState(false);
  const [parseProgress, setParseProgress] = useState(null);
  const [parse, setParse] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const refJobNumber = useRef('');
  const SseID = useRef('');
  const fileInputRef = useRef(null);
  const file = useRef(null);

  const handleOpenFileExplorer = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    try {
      const selectedFile = event.target.files[0];
      setFileLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await uploadKissFile(formData);
      if (res) {
        file.current = res;
      }
      importStart(getValues());
    } catch (e) {
      console.error('error:', e);
    } finally {
      setFileLoading(false);
    }
  };

  const resetJobNumber = () => {
    setValue('JobNumber', '');
    setValue('JobID', '');
    setError('JobNumber', {
      type: 'validate',
      message: '',
    });
    refJobNumber.current = null;
  };

  const getJobById = async ({ job_id, ...rest }) => {
    try {
      const res = await kissJobById({
        job_id,
        ...rest,
      });
      setValue('FilterLotNumbers', res.FilterLotNumbers?.join(', '));
      setValue('FilterPieceMarks', res.FilterPieceMarks?.join(', '));
      setValue('FilterSequences', res.FilterSequences?.join(', '));
      setValue('FilterSheetNumbers', res.FilterSheetNumbers?.join(', '));
    } catch (e) {
      if (e.response.data.Code === 409) {
        confirmDialog({
          closable: false,
          message: t(e.response.data.Detail, { 0: getValues().JobNumber }),
          header: t(e.response.data.Message, { 0: getValues().JobNumber }),
          acceptLabel: t('sts.btn.no'),
          acceptClassName: 'p-button-secondary',
          rejectLabel: t('sts.btn.yes'),
          rejectClassName: 'p-button-primary',
          accept: () => {
            resetJobNumber();
          },
          reject: () => {
            setTimeout(() => {
              confirmDialog({
                closable: false,
                message: t('sts.txt.kiss.cancel.process'),
                acceptLabel: t('sts.btn.no'),
                acceptClassName: 'p-button-secondary',
                rejectLabel: t('sts.btn.yes'),
                rejectClassName: 'p-button-primary',
                accept: () => {
                  resetJobNumber();
                },
                reject: () => {
                  getJobById({ job_id, skip_job_validation: true });
                },
                icon: 'pi pi-question-circle text-blue-400',
              });
            }, 100);
          },
          icon: 'pi pi-times-circle text-yellow-500',
        });

        return;
      }

      confirmDialog({
        closable: false,
        message: t(e.response.data.Detail, { 0: getValues().JobNumber }),
        header: t(e.response.data.Message, { 0: getValues().JobNumber }),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          resetJobNumber();
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const matchNumber = async (prefix) => {
    try {
      const { Entries } = await kissJobNumbers({
        prefix,
      });
      setNumberSuggestions(Entries.map(({ ID, Number }) => ({ label: Number, value: ID })));
    } catch (e) {
      confirmDialog({
        closable: false,
        message: t(e.response.data.Detail, { 0: prefix }),
        header: t(e.response.data.Message, { 0: prefix }),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          resetJobNumber();
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const proceedWithImport = (JobID, res) => {
    const piecemarks =
      res.ImportPreferences.MajorsWithoutPieceMarksFound ||
      res.ImportPreferences.MinorsWithoutPieceMarksFound;
    confirmDialog({
      closable: false,
      message: t(piecemarks ? 'sts.txt.import.empty.piecemarks' : 'sts.txt.import.empty.sheets'),
      header: t('sts.txt.question.continue.with.import'),
      acceptLabel: t('sts.btn.ok'),
      rejectClassName: 'hidden',
      accept: () => {
        success(res);
        navigate(`${location.pathname}?JobID=${JobID}`);
      },
      icon: 'pi pi-times-circle text-yellow-500',
    });
  };

  const badFilters = (JobID, res) => {
    confirmDialog({
      closable: false,
      message: t(1221),
      header: 1221,
      acceptLabel: t('sts.btn.no'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.yes'),
      rejectClassName: 'p-button-primary',
      reject: () => {
        if (
          res.ImportPreferences.MajorsWithoutPieceMarksFound ||
          res.ImportPreferences.MinorsWithoutPieceMarksFound ||
          res.ImportPreferences.MajorsWithoutSheetsFound ||
          res.ImportPreferences.MinorsWithoutSheetsFound
        ) {
          setTimeout(() => {
            proceedWithImport(JobID, res);
          }, 100);
          return;
        }
        success(res);
        navigate(`${location.pathname}?JobID=${JobID}`);
      },
      icon: 'pi pi-times-circle text-yellow-500',
    });
  };

  const importStart = async (data) => {
    if (data.LocalFile && !file.current?.Path) {
      handleOpenFileExplorer();
      return;
    }
    setParse(true);
    const es = new EventSource(
      `${API_CONFIG.baseURL}${ENDPOINTS.sse.importKiss}?token=${ServiceTokenStorage.getToken()}`,
    );
    es.onmessage = async (data) => {
      if (data.data.includes('sseid') && !SseID.current) {
        const parsedData = JSON.parse(data.data);
        SseID.current = parsedData.sseid;
      } else {
        if (data.data === 'end') {
          es.close();
          return;
        }
        setParseProgress(data.data);
      }
    };

    es.onopen = () => {
      setTimeout(async () => {
        try {
          const res = await kissImport({
            ...data,
            ...(data.LocalFile && { FileName: file.current.Path }),
            FilterLotNumbers: !data.FilterLotNumbers
              ? []
              : data.FilterLotNumbers.split(',')
                  .map(trimStartEnd)
                  .filter((val) => val),
            FilterPieceMarks: !data.FilterPieceMarks
              ? []
              : data.FilterPieceMarks.split(',')
                  .map(trimStartEnd)
                  .filter((val) => val),
            FilterSequences: !data.FilterSequences
              ? []
              : data.FilterSequences.split(',')
                  .map(trimStartEnd)
                  .filter((val) => val),
            FilterSheetNumbers: !data.FilterSheetNumbers
              ? []
              : data.FilterSheetNumbers.split(/[\s,]+/),
            SseID: SseID.current,
          });
          if (res.BadFilters) {
            badFilters(data.JobID, res);
            return;
          }
          if (
            res.ImportPreferences.MajorsWithoutPieceMarksFound ||
            res.ImportPreferences.MinorsWithoutPieceMarksFound ||
            res.ImportPreferences.MajorsWithoutSheetsFound ||
            res.ImportPreferences.MinorsWithoutSheetsFound
          ) {
            proceedWithImport(data.JobID, res);
            return;
          }
          success(res);
          navigate(`${location.pathname}?JobID=${data.JobID}`);
        } catch (e) {
          file.current = null;
          if (fileInputRef.current) {
            fileInputRef.current.value = null;
          }
          if (e.response.data.Code === 409) {
            confirmDialog({
              closable: false,
              message: t(e.response.data.Detail),
              header: t(e.response.data.Message),
              acceptLabel: t('sts.btn.no'),
              acceptClassName: 'p-button-secondary',
              rejectLabel: t('sts.btn.yes'),
              rejectClassName: 'p-button-primary',
              reject: () => {
                success({});
                navigate(`${location.pathname}?JobID=${data.JobID}`);
              },
              accept: () => {
                setValue('FilterSequences', '');
              },
              icon: 'pi pi-times-circle text-yellow-500',
            });
            return;
          }
          confirmDialog({
            closable: false,
            message: t(e.response.data.Detail, { 0: data.JobNumber }),
            header: t(e.response.data.Message, { 0: data.JobNumber }),
            acceptLabel: t('sts.btn.ok'),
            accept: () => {
              if (data.FileName) setValue('FileName', '');
            },
            rejectClassName: 'hidden',
            icon: 'pi pi-times-circle text-yellow-500',
          });
        } finally {
          setParseProgress(null);
          setParse(false);
          es.close();
          SseID.current = null;
        }
      }, 400);
    };
  };

  const onBlurFieldPreparation = (val) =>
    val
      .toUpperCase()
      .split(',')
      .map(trimStartEnd)
      .filter((val) => val)
      .join(',');

  return (
    <div id="kiss-import-configure" className="fadein flex flex-column h-full p-3">
      <Dialog visible={parse} style={{ minWidth: 400, height: 100 }} closable={false}>
        {!parseProgress ? `${t('sts.txt.processing')}...` : <p className="m-0">{parseProgress}</p>}
      </Dialog>
      <Dialog visible={fileLoading} style={{ minWidth: 400, height: 100 }} closable={false}>
        {`${t('sts.txt.processing')}...`}
      </Dialog>
      <SelectionFile
        isFileSelect={isSelectionFileOpen}
        setIsFileSelect={setIsSelectionFileOpen}
        selectedFile={(val) => {
          setValue('FileName', val);
          importStart(getValues());
        }}
      />
      <div className="flex justify-content-between align-items-center">
        <div className="flex">
          <h3>{t('sts.txt.kiss.import')}</h3>
          <h3 className="ml-4">{ServiceUserStorage.getUser().Association}</h3>
        </div>
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <form className="p-fluid">
          <div className="my-1">
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem">{t('sts.label.job.num')}:</div>
              <Controller
                name="JobNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip id={`Job_${index}`} label={value.label} />
                    )}
                    dropdown
                    onChange={(e) => {
                      field.onChange((e.value?.label || e.value).toUpperCase());
                    }}
                    onSelect={(e) => {
                      field.onChange(e.value.label);
                      setValue('JobID', e.value.value);
                      getJobById({ job_id: e.value.value });
                      refJobNumber.current = e.value.label;
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                        if (e.target.value && e.target.value !== refJobNumber.current) {
                          const MATCH = numberSuggestions.find(
                            ({ label }) => label === e.target.value,
                          );
                          if (!MATCH) {
                            confirmDialog({
                              closable: false,
                              message: t('1217'),
                              header: 1217,
                              acceptLabel: t('sts.btn.ok'),
                              rejectClassName: 'hidden',
                              icon: 'pi pi-exclamation-triangle text-yellow-500',
                              accept: () => {
                                field.onChange(refJobNumber.current);
                              },
                            });
                          } else {
                            field.onChange(MATCH.label);
                            setValue('JobID', MATCH.value);
                            getJobById({ job_id: MATCH.value });
                            refJobNumber.current = MATCH.label;
                          }
                        } else {
                          field.onChange(refJobNumber.current);
                        }
                      }, 400);
                    }}
                    autoHighlight
                    completeMethod={(e) => matchNumber(trimStartEnd(e.query))}
                    suggestions={numberSuggestions}
                    className={classNames({
                      required: true,
                      'w-30rem': true,
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem">{t('sts.label.sequence.num')}:</div>
              <div className="flex align-items-center">
                <Controller
                  name="FilterSequences"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={(e) =>
                        field.onChange(onBlurFieldPreparation(e.target.value.toUpperCase()))
                      }
                      className={classNames({
                        'w-20rem mr-2': true,
                      })}
                      maxLength={FORMS_CONFIG.FORM_KISS.fieldLength.FilterSequences}
                    />
                  )}
                />
                <span>{t('sts.txt.import.blank.sequence')}</span>
              </div>
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem">{t('sts.label.lot.num')}:</div>
              <div className="flex align-items-center">
                <Controller
                  name="FilterLotNumbers"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={(e) =>
                        field.onChange(onBlurFieldPreparation(e.target.value.toUpperCase()))
                      }
                      className={classNames({
                        'w-20rem mr-2': true,
                      })}
                      maxLength={FORMS_CONFIG.FORM_KISS.fieldLength.FilterLotNumbers}
                    />
                  )}
                />
                <span>{t('sts.txt.import.blank')}</span>
              </div>
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem">{t('sts.label.sheet.num')}:</div>
              <div className="flex align-items-center">
                <Controller
                  name="FilterSheetNumbers"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={(e) =>
                        field.onChange(onBlurFieldPreparation(e.target.value.toUpperCase()))
                      }
                      className={classNames({
                        'w-30rem': true,
                      })}
                      maxLength={FORMS_CONFIG.FORM_KISS.fieldLength.FilterSheetNumbers}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem">{t('sts.label.piecemark')}:</div>
              <div className="flex align-items-center">
                <Controller
                  name="FilterPieceMarks"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={(e) =>
                        field.onChange(onBlurFieldPreparation(e.target.value.toUpperCase()))
                      }
                      className={classNames({
                        'w-30rem': true,
                      })}
                      maxLength={FORMS_CONFIG.FORM_KISS.fieldLength.FilterPieceMarks}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex align-items-center mb-2">
              <div className="mr-4 w-10rem"></div>
              <Controller
                name="LocalFile"
                control={control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      {...field}
                      inputId="LocalFile"
                      checked={field.value}
                      onChange={(e) => {
                        if (!e.checked) setValue('FileName', null);
                        field.onChange(e.checked);
                      }}
                    />
                    <label htmlFor="LocalFile" className="ml-2">
                      {t('sts.chk.use.kiss.file')}
                    </label>
                  </>
                )}
                className={classNames({
                  'w-30rem': true,
                })}
              />
            </div>
          </div>
        </form>
        <p className="mt-4">{t('sts.txt.options.comma.separated')}</p>
      </div>
      <div className="flex justify-content-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button
          disabled={!isValid}
          label={t('sts.btn.kiss.get.file')}
          size="small"
          onClick={handleSubmit(importStart)}
        />
        <Button
          label={t('sts.btn.clear')}
          size="small"
          onClick={() => {
            refJobNumber.current = null;
            reset(EMPTY_FILTER);
          }}
        />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default KissImport;
