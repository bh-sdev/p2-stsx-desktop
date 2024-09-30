import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import AutoSizer from 'react-virtualized-auto-sizer';

import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';

import { ContextPiecemarkEntry } from '.';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { InputText } from 'primereact/inputtext';
import { FORMS_CONFIG } from 'configs';
import { InputNumber } from 'primereact/inputnumber';
import { maxNumberLength, noNullValues } from 'utils';
import { confirmDialog } from 'primereact/confirmdialog';
import {
  piecemarkEntryFinishes,
  piecemarkEntryGrades,
  piecemarkEntryLoadNumbers,
  piecemarkEntryLotNumbers,
  piecemarkEntryMaterials,
  piecemarkEntryRoutingCodes,
  piecemarkEntrySequenceNumbers,
  piecemarkEntryShopOrders,
  piecemarkFillInfoGet,
} from 'api';
import { Button } from 'primereact/button';
import { DEFAULT_ROW_HEIGHT } from 'const';

const convertToImperialString = (value) => {
  const string = value
    .replace(/\D/g, ' ')
    .split(' ')
    .filter((val) => !!val);

  if (string.length === 2) {
    return `${string[0]}'-${string[1]}"`;
  }
  if (string.length === 3) {
    return `${string[0]} ${string[1]}/${string[2]}"`;
  }
  if (string.length === 4) {
    return `${string[0]}'-${string[1]} ${string[2]}/${string[3]}"`;
  }
};

const Piecemark = ({ control, loading, setValue, data, busy, createNew, isValid, isDirty }) => {
  const { t } = useTranslation();
  const { job, isNew, isEdit, setIsNew, Create } = useContext(ContextPiecemarkEntry);
  const [loadSuggestions, setLoadSuggestions] = useState([]);
  const [shopOrderSuggestions, setShopOrderSuggestions] = useState([]);
  const [materialSuggestions, setMaterialSuggestions] = useState([]);
  const [sequenceSuggestions, setSequenceSuggestions] = useState([]);
  const [lotSuggestions, setLotSuggestions] = useState([]);
  const [routingCodeSuggestions, setRoutingCodeSuggestions] = useState([]);
  const [finishSuggestions, setFinishSuggestions] = useState([]);
  const [gradeSuggestions, setGradeSuggestions] = useState([]);

  const refRoutingCode = useRef();

  useEffect(() => {
    if (!isEdit || !isNew) {
      refRoutingCode.current = null;
    }
  }, [isEdit, isNew]);

  useEffect(() => {
    if (!refRoutingCode.current && data?.RoutingCode) {
      refRoutingCode.current = data?.RoutingCode;
    }
    if (isNew && !data?.RoutingCode) {
      refRoutingCode.current = null;
    }
  }, [data?.RoutingCode, isNew]);

  const matchingMap = {
    'PiecemarkEntry.LoadNumber': {
      get: piecemarkEntryLoadNumbers,
      set: setLoadSuggestions,
    },
    'PiecemarkEntry.ShopOrder': {
      get: piecemarkEntryShopOrders,
      set: setShopOrderSuggestions,
    },
    'PiecemarkEntry.Material': {
      get: piecemarkEntryMaterials,
      set: setMaterialSuggestions,
    },
    'PiecemarkEntry.SequenceNumber': {
      get: piecemarkEntrySequenceNumbers,
      set: setSequenceSuggestions,
    },
    'PiecemarkEntry.LotNumber': {
      get: piecemarkEntryLotNumbers,
      set: setLotSuggestions,
    },
    'PiecemarkEntry.Finish': {
      get: piecemarkEntryFinishes,
      set: setFinishSuggestions,
    },
    'PiecemarkEntry.Grade': {
      get: piecemarkEntryGrades,
      set: setGradeSuggestions,
    },
    'PiecemarkEntry.RoutingCode': {
      get: piecemarkEntryRoutingCodes,
      set: setRoutingCodeSuggestions,
    },
  };

  const matchSuggestions = async (key, prefix) => {
    const { get, set } = matchingMap[key];
    try {
      const { Entries } = await get({ prefix, job_id: job.ID });
      set(Entries.map(({ ID, Name }) => ({ label: Name, value: ID })));
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

  const checkPiecemarkFillInfo = async (value) => {
    try {
      const res = await piecemarkFillInfoGet(value, { job_id: job.ID });
      for (let key in noNullValues(res)) {
        if (res[key] !== '') {
          setValue(`PiecemarkEntry.${key}`, res[key], { shouldDirty: true, shouldError: false });
        }
      }
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

  return (
    <div className="h-full fadin flex flex-column relative">
      {!loading ? null : (
        <div className="h-full flex justify-content-center align-items-center absolute w-full z-5 bg-black-alpha-10">
          <ProgressSpinner
            style={{ width: '50px', height: '50px' }}
            pt={{
              circle: {
                style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' },
              },
            }}
          />
        </div>
      )}
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
            <form className="p-fluid w-30rem">
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.load.number')}:</div>
                  <Controller
                    name="PiecemarkEntry.LoadNumber"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={loadSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.shop.order.number')}:</div>
                  <Controller
                    name="PiecemarkEntry.ShopOrder"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={shopOrderSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.ShopOrderNumber}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.number.id')}:</div>
                  <Controller
                    name="PiecemarkEntry.IDNumber"
                    control={control}
                    render={({ field }) => <InputText {...field} readOnly disabled />}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.sheet.num')}:</div>
                  <Controller
                    name="PiecemarkEntry.SheetNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({
                          required: true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SheetNumber}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.quantity')}:</div>
                  <Controller
                    name="PiecemarkEntry.Quantity"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputNumber
                        {...field}
                        value={field.value === '' ? null : field.value}
                        onChange={(e) => {
                          const VAL =
                            e.value === null
                              ? ''
                              : maxNumberLength(
                                  FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Qty,
                                  e.value,
                                );
                          field.onChange(VAL);
                        }}
                        onBlur={(e) => {
                          const VAL = e.target.value;
                          if (!data.NumberOfLabels || VAL < data.NumberOfLabels) {
                            setValue('PiecemarkEntry.NumberOfLabels', VAL);
                          }
                        }}
                        disabled={!isNew}
                        className={classNames({
                          required: true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Qty}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.number.of.labels')}:</div>
                  <Controller
                    name="PiecemarkEntry.NumberOfLabels"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputNumber
                        {...field}
                        value={field.value === '' ? null : field.value}
                        useGrouping={false}
                        onChange={(e) => {
                          const VAL =
                            e.value === null
                              ? ''
                              : maxNumberLength(
                                  FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.NumberOfLabels,
                                  e.value,
                                );
                          field.onChange(VAL);
                        }}
                        onBlur={(e) => {
                          const VAL = Number(e.target.value);
                          if (VAL > data.Quantity) {
                            confirmDialog({
                              closable: false,
                              header: t('1255'),
                              message: t(`${t('sts.txt.label.quantity.entry.incorrect.more')}`),
                              acceptLabel: t('sts.btn.ok'),
                              rejectClassName: 'hidden',
                              icon: 'pi pi-times-circle text-yellow-500',
                            });
                          }
                        }}
                        disabled={!isNew}
                        className={classNames({
                          required: true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.NumberOfLabels}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.piecemark.parent')}:</div>
                  <Controller
                    name="PiecemarkEntry.ParentPiecemark"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                        onBlur={(e) => {
                          if (e.target.value && !data.Piecemark) {
                            setValue('PiecemarkEntry.Piecemark', e.target.value);
                            if (isNew) {
                              checkPiecemarkFillInfo(e.target.value);
                            }
                          }
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({
                          required: true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.ParentPiecemark}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.piecemark')}:</div>
                  <Controller
                    name="PiecemarkEntry.Piecemark"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                        onBlur={(e) => {
                          if (e.target.value && e.target.value === data.ParentPiecemark && isNew) {
                            checkPiecemarkFillInfo(e.target.value);
                          }
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({
                          required: true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Piecemark}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.material')}:</div>
                  <Controller
                    name="PiecemarkEntry.Material"
                    control={control}
                    render={({ field, fieldState }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={materialSuggestions}
                        className={classNames({
                          'w-full required': true,
                          'p-invalid': fieldState.invalid,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Material}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.sequence.num')}:</div>
                  <Controller
                    name="PiecemarkEntry.SequenceNumber"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={sequenceSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SequenceNumber}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.lot.num')}:</div>
                  <Controller
                    name="PiecemarkEntry.LotNumber"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={lotSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.LotNumber}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.finish')}:</div>
                  <Controller
                    name="PiecemarkEntry.Finish"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={finishSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Finish}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.grade')}:</div>
                  <Controller
                    name="PiecemarkEntry.Grade"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
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
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={gradeSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Grade}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.weight.each')}:</div>
                  <Controller
                    name="PiecemarkEntry.WeightEach"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        value={field.value === '' ? null : field.value}
                        maxFractionDigits={3}
                        onChange={(e) => {
                          field.onChange(e.value === null ? '' : String(e.value));
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({})}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.WeightEach}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.width')}:</div>
                  <Controller
                    name="PiecemarkEntry.Width"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        {...field}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value.replace(
                              job.Metric ? /\D/g : /(\s{1,})|[^\d'"/-]/g,
                              job.Metric ? '' : ' ',
                            ),
                          );
                        }}
                        onBlur={(e) => {
                          if (job.Metric) return;
                          if (fieldState.invalid) return;
                          field.onChange(convertToImperialString(e.target.value));
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({
                          'p-invalid': fieldState.invalid,
                        })}
                        placeholder={job.Metric ? '' : '(x)" (x)/(x)'}
                        maxLength={
                          FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength[
                            job?.Metric ? 'WidthMetric' : 'WidthImperial'
                          ]
                        }
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.length')}:</div>
                  <Controller
                    name="PiecemarkEntry.ItemLength"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        {...field}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value.replace(
                              job.Metric ? /\D/g : /(\s{1,})|[^\d'"/-]/g,
                              job.Metric ? '' : ' ',
                            ),
                          );
                        }}
                        onBlur={(e) => {
                          if (job.Metric) return;
                          if (fieldState.invalid) return;
                          field.onChange(convertToImperialString(e.target.value));
                        }}
                        disabled={!isNew && !isEdit}
                        className={classNames({
                          'p-invalid': fieldState.invalid,
                        })}
                        placeholder={job.Metric ? '' : `(x)'(x)" (x)/(x)`}
                        maxLength={
                          FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength[
                            job?.Metric ? 'LengthMetric' : 'LengthImperial'
                          ]
                        }
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.description')}:</div>
                  <Controller
                    name="PiecemarkEntry.Desc"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        {...field}
                        disabled={!isNew && !isEdit}
                        className={classNames({})}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Description}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="my-1">
                <div className="flex align-items-center">
                  <div className="mr-4 w-7">{t('sts.label.routing.code')}:</div>
                  <Controller
                    name="PiecemarkEntry.RoutingCode"
                    control={control}
                    render={({ field }) => (
                      <AutoComplete
                        {...field}
                        disabled={!isNew && !isEdit}
                        virtualScrollerOptions={{
                          itemSize: DEFAULT_ROW_HEIGHT,
                        }}
                        itemTemplate={(value, index) => (
                          <DropdownItemTooltip id={`Number_${index}`} label={value.label} />
                        )}
                        dropdown
                        onChange={(e) => {
                          if (!e.target.value) {
                            setValue('PiecemarkEntry.RoutingCodeID', '');
                            refRoutingCode.current = null;
                          }
                          field.onChange(e.target.value);
                        }}
                        onSelect={(e) => {
                          field.onChange(e.value.label);
                          setValue('PiecemarkEntry.RoutingCodeID', e.value.value);
                          refRoutingCode.current = e.value.label;
                        }}
                        onBlur={(e) => {
                          setTimeout(() => {
                            if (refRoutingCode.current !== e.target.value) {
                              const MATCH = routingCodeSuggestions.find(
                                ({ ID }) => ID === e.target.value,
                              );
                              if (MATCH) {
                                field.onChange(MATCH?.Name);
                                setValue('PiecemarkEntry.RoutingCodeID', MATCH.ID);
                              } else {
                                field.onChange(refRoutingCode.current);
                              }
                            }
                          }, 400);
                        }}
                        autoHighlight
                        field="label"
                        completeMethod={(e) => matchSuggestions(field.name, e.query)}
                        suggestions={routingCodeSuggestions}
                        className={classNames({
                          'w-full': true,
                        })}
                        maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.RoutingCode}
                      />
                    )}
                  />
                </div>
              </div>
            </form>
          </ScrollPanel>
        )}
      </AutoSizer>
      <div className="flex justify-content-end gap-2 mt-2">
        {!isNew ? (
          <Button
            label={t('sts.btn.add.piecemark')}
            size="small"
            severity="primary"
            onClick={setIsNew}
            disabled={!Create || !job.ID || loading || isEdit}
          />
        ) : (
          <Button
            disabled={!isValid || !isDirty}
            label={`${t('sts.btn.save')} & ${t('sts.btn.add')}`}
            size="small"
            loading={busy}
            onClick={createNew}
          />
        )}
      </div>
    </div>
  );
};

export default Piecemark;
