import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import moment from 'moment';

import AutoSizer from 'react-virtualized-auto-sizer';

import { ScrollPanel } from 'primereact/scrollpanel';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';
import { confirmDialog } from 'primereact/confirmdialog';

import { ContextPiecemarkEntry } from '.';
import { maxNumberLength } from 'utils';
import { FORMS_CONFIG } from 'configs';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { piecemarkEntryCowCodes } from 'api';
import { DEFAULT_ROW_HEIGHT } from 'const';

const PiecemarkInfo = ({ control, loading, data }) => {
  const { t } = useTranslation();
  const { isNew, isEdit, job } = useContext(ContextPiecemarkEntry);
  const [cowCodeSuggestions, setCowCodeSuggestions] = useState([]);

  const matchingMap = {
    'PiecemarkInfo.COWCode': {
      get: piecemarkEntryCowCodes,
      set: setCowCodeSuggestions,
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
            <form className="w-12">
              <div className="flex flex-wrap w-12">
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.sheet.num')}:</div>
                    <Controller
                      name="PiecemarkInfo.SheetNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.pcmk.quantity')}:</div>
                    <Controller
                      name="PiecemarkInfo.Quantity"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.piecemark.parent')}:</div>
                    <Controller
                      name="PiecemarkInfo.ParentPiecemark"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.piecemark')}:</div>
                    <Controller
                      name="PiecemarkInfo.Piecemark"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.material')}:</div>
                    <Controller
                      name="PiecemarkInfo.Material"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.description')}:</div>
                    <Controller
                      name="PiecemarkInfo.Desc"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.part.serial')}:</div>
                    <Controller
                      name="PiecemarkInfo.PartSerial"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.cow.xref.id')}:</div>
                    <Controller
                      name="PiecemarkInfo.CowXRefID"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.routing.code')}:</div>
                    <Controller
                      name="PiecemarkInfo.RoutingCode"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.item.weight.lb')}:</div>
                    <Controller
                      name="PiecemarkInfo.ItemWeightLb"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          value={field.value ? field.value?.toFixed(3) : ''}
                          readOnly
                          disabled
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.txt.weight.metric')}:</div>
                    <Controller
                      name="PiecemarkInfo.ItemWeightKg"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          value={field.value ? field.value?.toFixed(3) : ''}
                          readOnly
                          disabled
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.record.create.date')}:</div>
                    <Controller
                      name="PiecemarkInfo.CreateDate"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          value={!field.value ? '' : moment(field.value).format('L')}
                          readOnly
                          disabled
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.length')}:</div>
                    <Controller
                      name="PiecemarkInfo.ItemLength"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.width')}:</div>
                    <Controller
                      name="PiecemarkInfo.Width"
                      control={control}
                      render={({ field }) => (
                        <InputText className="w-full" {...field} readOnly disabled />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.cow.code')}:</div>
                    <Controller
                      name="PiecemarkInfo.COWCode"
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
                          suggestions={cowCodeSuggestions}
                          className={classNames({
                            'w-full': true,
                          })}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.COWCode}
                        />
                      )}
                    />
                    {/* <Controller
                      name="PiecemarkInfo.COWCode"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.COWCode}
                        />
                      )}
                    /> */}
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.cow.quantity')}:</div>
                    <Controller
                      name="PiecemarkInfo.COWQuantity"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={(!isNew && !isEdit) || !data.COWCode}
                          onChange={(e) => {
                            const VAL = maxNumberLength(15, e.value);
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={4}
                          className={classNames({
                            'p-invalid': field.value === 0,
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.cost.each')}:</div>
                    <Controller
                      name="PiecemarkInfo.CostEach"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = e.value === null ? '' : maxNumberLength(11, e.value);
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.CostEach}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.remarks')}:</div>
                    <Controller
                      name="PiecemarkInfo.Remarks"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Remarks}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.camber')}:</div>
                    <Controller
                      name="PiecemarkInfo.Camber"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = e.value === null ? '' : maxNumberLength(15, e.value);
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={4}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Camber}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.product.type')}:</div>
                    <Controller
                      name="PiecemarkInfo.ProductType"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.ProductType}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.col.label.category')}:</div>
                    <Controller
                      name="PiecemarkInfo.Category"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Category}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.subcategory')}:</div>
                    <Controller
                      name="PiecemarkInfo.SubCategory"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SubCategory}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">
                      {t('table.piecemarks.material_specification')}:
                    </div>
                    <Controller
                      name="PiecemarkInfo.MaterialSpec"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SubCategory}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.rule.code')}:</div>
                    <Controller
                      name="PiecemarkInfo.RuleCode"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          className="w-full"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.RuleCode}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">
                      {`${t('sts.label.fireproof.cubic.feet')} / ${t(
                        'sts.label.fireproof.cubic.meters',
                      )}`}
                      :
                    </div>
                    <Controller
                      name="PiecemarkInfo.FireproofCubicJobRelated"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength
                                      .FireproofCubicJobRelated,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={
                            FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.FireproofCubicJobRelated
                          }
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.handling')}:</div>
                    <Controller
                      name="PiecemarkInfo.HandlingMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.HandlingMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.HandlingMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.saw')}:</div>
                    <Controller
                      name="PiecemarkInfo.SawMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SawMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.SawMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.weld')}:</div>
                    <Controller
                      name="PiecemarkInfo.WeldMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.WeldMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.WeldMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.fabrication')}:</div>
                    <Controller
                      name="PiecemarkInfo.FabMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.FabMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.FabMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.detail')}:</div>
                    <Controller
                      name="PiecemarkInfo.DetailMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.DetailMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.DetailMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-30rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-10rem">{t('sts.label.minutes.paint')}:</div>
                    <Controller
                      name="PiecemarkInfo.PaintMin"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL =
                              e.value === null
                                ? ''
                                : maxNumberLength(
                                    FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.PaintMin,
                                    e.value,
                                  );
                            field.onChange(VAL);
                          }}
                          maxFractionDigits={3}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.PaintMin}
                          min={1}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </ScrollPanel>
        )}
      </AutoSizer>
    </div>
  );
};

export default PiecemarkInfo;
