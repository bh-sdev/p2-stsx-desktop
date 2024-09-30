import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { AutoComplete } from 'primereact/autocomplete';

import {
  addressDelete,
  addressGetCollection,
  addressGetTypes,
  addressNew,
  addressUpdate,
  getCities,
  getZipCodeById,
  getZipCodes,
} from 'api';
import { GlobalContext } from '..';
import { FORMS_CONFIG } from 'configs';
import { trimStartEnd } from 'utils';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const EMPTY = {
  City: '',
  Country: '',
  Line1: '',
  Line2: '',
  Note: '',
  State: '',
  Type: '',
  Zipcode: '',
};

const AddressesValidationSchema = yup.object({
  Type: yup.string().trim().required(),
  Line1: yup.string().trim().required(),
  City: yup.string().trim().required(),
  State: yup.string().trim().required().min(2),
  Country: yup.string().trim().required(),
  Zipcode: yup.string().trim().required(),
});

const Addresses = ({ personID, isEdit, Edit, Create, Delete }) => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
    getValues,
    setValue,
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(AddressesValidationSchema),
  });
  const [busy, setBusy] = useState(false);
  const [isEditAddress, setIsEditAddress] = useState(false);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [data, setData] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(EMPTY);
  const [zipCodes, setZipCodes] = useState([]);
  const [typeSuggestions, setTypeSuggestions] = useState([]);
  const [types, setTypes] = useState([]);
  const [citiesSuggestions, setCitiesSuggestions] = useState([]);
  const prevSelected = useRef(null);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = () => addressGetTypes().then(({ Entries }) => setTypes(Entries));

  const matchZipCode = async (prefix) => {
    if (isEditAddress || isNewAddress) {
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
    }
  };

  const searchType = (event) => {
    setTypeSuggestions(
      types.filter((type) => type?.toLowerCase().indexOf(event.query.toLowerCase()) !== -1),
    );
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

  useEffect(() => {
    reset(currentAddress);
  }, [currentAddress, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      if (isNewAddress) {
        data.pop();
        setData(data);
        setCurrentAddress(data[0]);
      }
      setIsEditAddress(false);
      setIsNewAddress(false);
    }
  }, [isEdit, isEditAddress, isNewAddress]);

  const load = async (selectFirst = true) => {
    try {
      const { Addresses } = await addressGetCollection({ person_id: personID });
      setData(Addresses.sort((a, b) => (a.Type < b.Type ? -1 : 1)));
      selectFirst && setCurrentAddress(Addresses[0] || EMPTY);
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
    load();
  }, [personID]);

  const deleteRequest = async () => {
    try {
      await addressDelete(currentAddress?.ID);
      const updated = data.filter(({ ID }) => ID !== currentAddress?.ID);
      setData(updated);
      setCurrentAddress(updated[0] || EMPTY);
      isEditAddress && setIsEditAddress(false);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const deleteAddress = () => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.delete.this.address.question'),
      header: t('sts.txt.delete.record'),
      rejectClassName: 'p-button-danger',
      acceptLabel: t('sts.txt.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.txt.delete'),
      icon: 'pi pi-exclamation-triangle text-yellow-500',
      reject: deleteRequest,
    });
  };

  const save = async () => {
    try {
      setBusy(true);
      const values = getValues();
      if (isNewAddress) {
        const newAddress = await addressNew({ ...values, personID });
        setData([...data, newAddress]);
        setCurrentAddress(newAddress);
        setIsNewAddress(false);
      } else {
        await addressUpdate(currentAddress?.ID, values);
        setIsEditAddress(false);
        setData((prevState) => {
          return prevState.map((item) => {
            if (item.ID !== currentAddress?.ID) {
              return item;
            } else {
              const updatedItem = { ...item, ...values };
              setCurrentAddress(updatedItem);
              return updatedItem;
            }
          });
        });
      }
      loadTypes();
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    } finally {
      setBusy(false);
    }
  };

  const typeFieldFlow = (value, field) => {
    field.onChange(trimStartEnd(value));
    const existingModel = data.find(({ Type }) => Type === value);
    existingModel && setCurrentAddress(existingModel);
    if (isNewAddress && existingModel) {
      setIsNewAddress(false);
      setIsEditAddress(true);
    }
  };

  return (
    <div className="h-full flex flex-column">
      <div className="flex-auto flex flex-column pb-2">
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
              <div className="flex-auto w-30rem">
                <form onSubmit={handleSubmit(() => {})} className="p-fluid">
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.address.type')}:</div>
                      <Controller
                        name="Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`Type_${index}`} label={value} />
                            )}
                            autoFocus={isNewAddress}
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            dropdown
                            onSelect={(e) => {
                              typeFieldFlow(e.value, field);
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                typeFieldFlow(e.target.value, field);
                              }, 400);
                            }}
                            autoHighlight
                            completeMethod={searchType}
                            suggestions={typeSuggestions}
                            maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Type}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.zip.code')}:</div>
                      <Controller
                        name="Zipcode"
                        control={control}
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`Zipcode_${index}`} label={value} />
                            )}
                            autoHighlight
                            completeMethod={(event) => matchZipCode(event.query)}
                            suggestions={zipCodes}
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            onSelect={async ({ value }) => {
                              getZipCodeById(value).then(({ PrimaryCity, State, Country }) => {
                                !getValues().State && setValue('State', State);
                                !getValues().City && setValue('City', PrimaryCity);
                                !getValues().Country && setValue('Country', Country);
                              });
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                const value = e.target.value;
                                if (value && zipCodes.includes(value)) {
                                  getZipCodeById(value).then(({ PrimaryCity, State, Country }) => {
                                    !getValues().State &&
                                      reset({
                                        ...getValues(),
                                        State,
                                      });
                                    !getValues().City &&
                                      reset({
                                        ...getValues(),
                                        City: PrimaryCity,
                                      });
                                    !getValues().Country &&
                                      reset({
                                        ...getValues(),
                                        Country,
                                      });
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
                                            setValue('Zipcode', '');
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
                      <div className="mr-4 w-7">{t('sts.label.line1')}:</div>
                      <Controller
                        name="Line1"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            {...field}
                            className={classNames({
                              required: true,
                              'p-invalid': fieldState.invalid,
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
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Line2}
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
                        render={({ field, fieldState }) => (
                          <AutoComplete
                            {...field}
                            virtualScrollerOptions={{
                              itemSize: DEFAULT_ROW_HEIGHT,
                            }}
                            itemTemplate={(value, index) => (
                              <DropdownItemTooltip id={`City_${index}`} label={value} />
                            )}
                            dropdown
                            disabled={!isEditAddress && !isNewAddress}
                            completeMethod={searchCity}
                            suggestions={citiesSuggestions}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
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
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            {...field}
                            className={classNames({
                              required: true,
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
                      <div className="mr-4 w-7">{t('sts.label.country')}:</div>
                      <Controller
                        name="Country"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputText
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            {...field}
                            className={classNames({
                              required: true,
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Country}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.note')}:</div>
                      <Controller
                        name="Note"
                        control={control}
                        render={({ field, fieldState }) => (
                          <InputTextarea
                            disabled={!isEditAddress && !isNewAddress}
                            id={field.name}
                            {...field}
                            className={classNames({
                              'w-full': true,
                              'p-invalid': fieldState.invalid,
                            })}
                            maxLength={FORMS_CONFIG.FORM_ADDRESS.fieldLength.Note}
                          />
                        )}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <DataTable
                removableSort
                virtualScrollerOptions={{
                  itemSize: DEFAULT_ROW_HEIGHT,
                }}
                scrollHeight={`${300}px`}
                scrollable
                value={data}
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                showGridlines
                size="small"
                selectionMode="single"
                selection={currentAddress}
                onSelectionChange={(e) => !isNewAddress && setCurrentAddress(e.value)}
                onColReorder={() => {}}
              >
                <Column
                  headerTooltip={t('sts.col.label.description')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="Type"
                  sortable
                  header={t('sts.col.label.description')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.line1')}
                  headerTooltipOptions={{ position: 'top' }}
                  bodyStyle={{ maxWidth: 100 }}
                  field="Line1"
                  sortable
                  header={t('sts.col.label.line1')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.line2')}
                  headerTooltipOptions={{ position: 'top' }}
                  bodyStyle={{ maxWidth: 100 }}
                  field="Line2"
                  sortable
                  header={t('sts.col.label.line2')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.city')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="City"
                  sortable
                  header={t('sts.col.label.city')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.state')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="State"
                  sortable
                  header={t('sts.col.label.state')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.zip.code')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="Zipcode"
                  sortable
                  header={t('sts.col.label.zip.code')}
                ></Column>
              </DataTable>
            </ScrollPanel>
          )}
        </AutoSizer>
        <div className="flex justify-content-end gap-2 mt-3">
          {isEdit ? (
            <>
              {!isNewAddress && currentAddress?.ID && (
                <Button
                  label={t('sts.btn.delete.address')}
                  severity="danger"
                  size="small"
                  disabled={!Delete}
                  onClick={deleteAddress}
                />
              )}
              {(isNewAddress || isEditAddress) && (
                <Button
                  type="submit"
                  disabled={
                    !isValid || !isDirty || (isNewAddress && !Create) || (isEditAddress && !Edit)
                  }
                  loading={busy}
                  label={t('sts.btn.save')}
                  size="small"
                  onClick={save}
                />
              )}
              {!isNewAddress && currentAddress?.ID && !isEditAddress && (
                <Button
                  type="submit"
                  loading={busy}
                  label={t('sts.btn.edit.address')}
                  size="small"
                  disabled={!Edit}
                  severity="secondary"
                  onClick={() => setIsEditAddress(true)}
                />
              )}
              {(isEditAddress || isNewAddress) && (
                <Button
                  label={t('sts.btn.cancel')}
                  size="small"
                  onClick={() => {
                    if (isNewAddress) {
                      setIsNewAddress(false);
                      setCurrentAddress(prevSelected.current);
                    }
                    if (isEditAddress) {
                      setIsEditAddress(false);
                    }
                    reset();
                  }}
                />
              )}
              {!isNewAddress && !isEditAddress && (
                <Button
                  label={t('sts.btn.add.address')}
                  size="small"
                  disabled={!Create}
                  onClick={() => {
                    prevSelected.current = currentAddress;
                    setIsNewAddress(true);
                    setCurrentAddress(EMPTY);
                  }}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Addresses;
