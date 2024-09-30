import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import AutoSizer from 'react-virtualized-auto-sizer';

import { ProgressSpinner } from 'primereact/progressspinner';
import { ScrollPanel } from 'primereact/scrollpanel';
import { InputText } from 'primereact/inputtext';

import { ContextPiecemarkEntry } from '.';
import moment from 'moment';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { maxNumberLength } from 'utils';
import { InputNumber } from 'primereact/inputnumber';
import { FORMS_CONFIG } from 'configs';

const IdInfo = ({ control, loading }) => {
  const { t } = useTranslation();
  const { isNew, isEdit } = useContext(ContextPiecemarkEntry);

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
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.sheet.num')}:</div>
                    <Controller
                      name="IDInfo.SheetNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.sequence.num')}:</div>
                    <Controller
                      name="IDInfo.SequenceNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('sts.label.piecemark.parent')}:
                    </div>
                    <Controller
                      name="IDInfo.ParentPiecemark"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.piecemark')}:</div>
                    <Controller
                      name="IDInfo.Piecemark"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.material')}:</div>
                    <Controller
                      name="IDInfo.Material"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.description')}:</div>
                    <Controller
                      name="IDInfo.Desc"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.part.serial')}:</div>
                    <Controller
                      name="IDInfo.PartSerial"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.id_serial_numbers.id_serial_number')}:
                    </div>
                    <Controller
                      name="IDInfo.IDSerialNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.shop.order')}:</div>
                    <Controller
                      name="IDInfo.ShopOrder"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.lots.lot_number')}:</div>
                    <Controller
                      name="IDInfo.LotNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.original_quantity')}:
                    </div>
                    <Controller
                      name="IDInfo.OriginalQuantity"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('sts.label.load.current')}:</div>
                    <Controller
                      name="IDInfo.CurrentLoadNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.id_on_hold')}:
                    </div>
                    <Controller
                      name="IDInfo.OnHoldFlag"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? t('sts.btn.yes') : t('sts.btn.no')}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.on_hold_date')}:
                    </div>
                    <Controller
                      name="IDInfo.OnHoldDate"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? moment(field.value).format('L') : ''}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.general.bundle.bc')}:</div>
                    <Controller
                      name="IDInfo.BundleBc"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.cut.list.bc')}:
                    </div>
                    <Controller
                      name="IDInfo.CutListBc"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.guid_major')}:
                    </div>
                    <Controller
                      name="IDInfo.FsMajorGUID"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.guid_minor')}:
                    </div>
                    <Controller
                      name="IDInfo.FsMinorGUID"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.raw_material_id')}:
                    </div>
                    <Controller
                      name="IDInfo.RawMaterialID"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('sts.label.record.create.date')}:
                    </div>
                    <Controller
                      name="IDInfo.CreateDate"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? moment(field.value).format('L') : ''}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.lprint')}:</div>
                    <Controller
                      name="IDInfo.Printed"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? t('sts.btn.yes') : t('sts.btn.no')}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.print_date')}:
                    </div>
                    <Controller
                      name="IDInfo.PrintDate"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? moment(field.value).format('L') : ''}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.edit_date')}:</div>
                    <Controller
                      name="IDInfo.EditDate"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          value={field.value ? moment(field.value).format('L') : ''}
                          readOnly
                          disabled
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.original_employee')}:
                    </div>
                    <Controller
                      name="IDInfo.OriginalEmployee"
                      control={control}
                      render={({ field }) => (
                        <InputText {...field} readOnly disabled className="w-full" />
                      )}
                    />
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-wrap w-12">
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.revision_level')}:
                    </div>
                    <Controller
                      name="IDInfo.RevisionLevel"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.RevisionLevel}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.id_location')}:
                    </div>
                    <Controller
                      name="IDInfo.Location"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Location}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.summed_quantity')}:
                    </div>
                    <Controller
                      name="IDInfo.SummedQuantity"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          onChange={(e) => {
                            field.onChange(e.value);
                          }}
                          useGrouping={false}
                          disabled={!isNew && !isEdit}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.erection_drawing')}:
                    </div>
                    <Controller
                      name="IDInfo.ErectionDrawing"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.ErectionDrawing}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.control_number')}:
                    </div>
                    <Controller
                      name="IDInfo.ControlNumber"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.ControlNumber}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.fabrication_invoice')}:
                    </div>
                    <Controller
                      name="IDInfo.FabInvoice"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.FabInvoice}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.id_remarks')}:
                    </div>
                    <Controller
                      name="IDInfo.Remarks"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Remarks}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.piece_color')}:
                    </div>
                    <Controller
                      name="IDInfo.PieceColor"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.PieceColor}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.id_finish')}:</div>
                    <Controller
                      name="IDInfo.Finish"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Finish}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.required_ship_date')}:
                    </div>
                    <Controller
                      name="IDInfo.RequiredShipDate"
                      control={control}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          showTime
                          hourFormat="12"
                          value={field.value ? new Date(field.value) : ''}
                          dateFormat="mm/dd/yy"
                          placeholder="mm/dd/yyyy h:mm a"
                          showIcon
                          disabled={!isNew && !isEdit}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.scheduled_ship_date')}:
                    </div>
                    <Controller
                      name="IDInfo.ScheduledShipDate"
                      control={control}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          showTime
                          hourFormat="12"
                          value={field.value ? new Date(field.value) : ''}
                          dateFormat="mm/dd/yy"
                          placeholder="mm/dd/yyyy h:mm a"
                          showIcon
                          disabled={!isNew && !isEdit}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.id_batch')}:</div>
                    <Controller
                      name="IDInfo.Batch"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Batch}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.bhn_test')}:</div>
                    <Controller
                      name="IDInfo.BHNTest"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          disabled={!isNew && !isEdit}
                          options={[
                            { label: t('sts.btn.yes'), value: true },
                            { label: t('sts.btn.no'), value: false },
                          ]}
                          showClear={field.value !== ''}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.pmi_test')}:</div>
                    <Controller
                      name="IDInfo.PMITest"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          disabled={!isNew && !isEdit}
                          options={[
                            { label: t('sts.btn.yes'), value: true },
                            { label: t('sts.btn.no'), value: false },
                          ]}
                          showClear={field.value !== ''}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.stress_test')}:
                    </div>
                    <Controller
                      name="IDInfo.StressTest"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          disabled={!isNew && !isEdit}
                          options={[
                            { label: t('sts.btn.yes'), value: true },
                            { label: t('sts.btn.no'), value: false },
                          ]}
                          showClear={field.value !== ''}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.qc_final_test')}:
                    </div>
                    <Controller
                      name="IDInfo.FinalQCTest"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          disabled={!isNew && !isEdit}
                          options={[
                            { label: t('sts.btn.yes'), value: true },
                            { label: t('sts.btn.no'), value: false },
                          ]}
                          showClear={field.value !== ''}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.hydro_test')}:
                    </div>
                    <Controller
                      name="IDInfo.HydroTest"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          disabled={!isNew && !isEdit}
                          options={[
                            { label: t('sts.btn.yes'), value: true },
                            { label: t('sts.btn.no'), value: false },
                          ]}
                          showClear={field.value !== ''}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.altitude')}:</div>
                    <Controller
                      name="IDInfo.Altitude"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          useGrouping={false}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(14, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          maxFractionDigits={8}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.longitude')}:</div>
                    <Controller
                      name="IDInfo.Longitude"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          useGrouping={false}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(13, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          maxFractionDigits={8}
                          className={classNames({
                            'p-invalid': field.value === 0,
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.latitude')}:</div>
                    <Controller
                      name="IDInfo.Latitude"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          useGrouping={false}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(12, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          maxFractionDigits={8}
                          className={classNames({
                            'p-invalid': field.value === 0,
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.mrr')}:</div>
                    <Controller
                      name="IDInfo.MRR"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.MRR}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.piece_phase')}:
                    </div>
                    <Controller
                      name="IDInfo.PiecePhase"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.PiecePhase}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.id_area')}:</div>
                    <Controller
                      name="IDInfo.Area"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.Area}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.piece_release')}:
                    </div>
                    <Controller
                      name="IDInfo.PieceRelease"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          disabled={!isNew && !isEdit}
                          maxLength={FORMS_CONFIG.FORM_PIECEMARK_ENTRY.fieldLength.PieceRelease}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_pkgid')}:</div>
                    <Controller
                      name="IDInfo.FtPkgID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_pkgno')}:</div>
                    <Controller
                      name="IDInfo.FtPkgNo"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_seqid')}:</div>
                    <Controller
                      name="IDInfo.FtSequenceID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_sitid')}:</div>
                    <Controller
                      name="IDInfo.FtSideID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.reference_date')}:
                    </div>
                    <Controller
                      name="IDInfo.ReferenceDate"
                      control={control}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          showTime
                          hourFormat="12"
                          value={field.value ? new Date(field.value) : ''}
                          dateFormat="mm/dd/yy"
                          placeholder="mm/dd/yyyy h:mm a"
                          showIcon
                          disabled={!isNew && !isEdit}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_assyid')}:</div>
                    <Controller
                      name="IDInfo.FtAssemblyID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">
                      {t('table.idfiles.ft_assinid')}:
                    </div>
                    <Controller
                      name="IDInfo.FtAssinID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_batch')}:</div>
                    <Controller
                      name="IDInfo.FtBatch"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_lot')}:</div>
                    <Controller
                      name="IDInfo.FtLot"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
                          className={classNames({
                            'w-full': true,
                          })}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="my-1 w-25rem">
                  <div className="flex align-items-center pr-3">
                    <div className="mr-4 w-7rem flex-shrink-0">{t('table.idfiles.ft_partid')}:</div>
                    <Controller
                      name="IDInfo.FtPartID"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value === '' ? null : field.value}
                          disabled={!isNew && !isEdit}
                          onChange={(e) => {
                            const VAL = maxNumberLength(32, e.value);
                            field.onChange(VAL === 0 ? null : VAL);
                          }}
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

export default IdInfo;
