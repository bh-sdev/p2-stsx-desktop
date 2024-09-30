import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { FORMS_CONFIG } from 'configs';
import { useContext, useEffect, useRef, useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { trimStartEnd } from 'utils';
import { AutoComplete } from 'primereact/autocomplete';
import { piecemarkEntryJob, piecemarkEntryJobs } from 'api';
import { ContextPiecemarkEntry } from '.';
import { DEFAULT_ROW_HEIGHT } from 'const';
import { jobsGet } from 'api/api.jobs';

const TopFormValidationSchema = yup.object({
  Number: yup.string().required(),
});

const DEFAULT_CRITERIA = {
  CustomerName: '',
  CustomerNumber: '',
  ID: '',
  JobWeight: null,
  MetricJob: false,
  Number: '',
  Status: '',
  Title: '',
};

const TopForm = () => {
  const { t } = useTranslation();
  const { setJob, isEdit, isNew } = useContext(ContextPiecemarkEntry);
  const { control, reset, getValues, setValue } = useForm({
    mode: 'onChange',
    defaultValues: DEFAULT_CRITERIA,
    resolver: yupResolver(TopFormValidationSchema),
  });
  const [numberSuggestions, setNumberSuggestions] = useState([]);

  const refIsAutocompleteIsOpen = useRef(false);
  const refFieldJobNumber = useRef();
  const refLocalSelectedJob = useRef({});
  const refClosedJobs = useRef({});

  useEffect(() => {
    initClosedJobs();
  }, []);

  const initClosedJobs = async () => {
    const { Entries } = await jobsGet({ include_closed: true });
    refClosedJobs.current = Entries.filter(({ Status }) => Status === 'Closed').map(
      ({ Number }) => Number,
    );
  };

  const onHandleSelectJob = async (data) => {
    refLocalSelectedJob.current = data;
    reset(data);
    try {
      const res = await piecemarkEntryJob(data.ID);
      setValue('JobWeight', res.Weight);
      setJob(res);
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

  const matchNumber = async (prefix) => {
    refIsAutocompleteIsOpen.current = true;
    try {
      const { Entries } = await piecemarkEntryJobs({ prefix });
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
      onHandleSelectJob(MATCHED.value);
    } else {
      confirmDialog({
        closable: false,
        message: t(refClosedJobs.current.includes(data) ? '426' : '1217'),
        header: t(refClosedJobs.current.includes(data) ? '426' : '1217'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          reset(refLocalSelectedJob.current);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const clear = () => {
    reset(DEFAULT_CRITERIA);
    refLocalSelectedJob.current = {};
    setJob({});
  };

  return (
    <div className="w-12">
      <div className="flex align-items-center mb-2 xl:w-30rem lg:w-8 w-10">
        <div className="mr-4 w-12rem">{t('sts.label.job.number')}:</div>
        <div className="w-full">
          <Controller
            name="Number"
            control={control}
            render={({ field, fieldState }) => (
              <AutoComplete
                {...field}
                disabled={isEdit || isNew}
                ref={refFieldJobNumber}
                onKeyDown={(e) => {
                  if (!refIsAutocompleteIsOpen.current && e.key === 'Enter') {
                    refFieldJobNumber.current.search(e, '');
                  }
                }}
                virtualScrollerOptions={{
                  itemSize: DEFAULT_ROW_HEIGHT,
                }}
                itemTemplate={(value, index) => (
                  <DropdownItemTooltip id={`Number_${index}`} label={value.label} />
                )}
                dropdown
                onSelect={(e) => onHandleSelectJob(e.value.value)}
                onBlur={(e) => {
                  setTimeout(() => {
                    refIsAutocompleteIsOpen.current = false;
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
                completeMethod={(event) => matchNumber(trimStartEnd(event.query))}
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

      <div className="flex align-items-center mb-2 xl:w-30rem lg:w-8 w-10">
        <div className="mr-4 w-12rem">{t('sts.label.job.weight')}:</div>
        <div className="w-full">
          <Controller
            name="JobWeight"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                value={
                  field.value === null
                    ? ''
                    : `${Number(field.value).toFixed(2)} ${getValues().MetricJob ? 'kgs' : 'lbs'}`
                }
                readOnly
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="flex align-items-center mb-2 xl:w-30rem lg:w-8 w-10">
        <div className="mr-4 w-12rem">{t('sts.label.customer.number')}:</div>
        <div className="w-full">
          <Controller
            name="CustomerNumber"
            control={control}
            render={({ field }) => <InputText {...field} readOnly className="w-full" />}
          />
        </div>
      </div>

      <div className="flex align-items-center xl:w-30rem lg:w-8 w-10">
        <div className="mr-4 w-12rem">{t('sts.label.customer.name')}:</div>
        <div className="w-full">
          <Controller
            name="CustomerName"
            control={control}
            render={({ field }) => <InputText {...field} readOnly className="w-full" />}
          />
        </div>
      </div>
    </div>
  );
};

export default TopForm;
