import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';

import {
  associationCreate,
  associationDelete,
  associationGetCollection,
  associationUpdate,
  updateTenant,
} from 'api';
import useActions from 'hooks/useActions';
import { debounce, onCopy, trimStartEnd } from 'utils';
import { FORM_DIVISION } from 'configs/forms.config';

import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useWindowControl from 'hooks/useWindowControl';
import useGetPermissions from 'hooks/useGetPermissions';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import useTableNavigation from 'hooks/useTableNavigation';
import { DEFAULT_ROW_HEIGHT } from 'const';

const DivisionValidationSchema = yup.object({
  Name: yup.string().trim().required(),
});

const EMPTY = {
  Name: '',
  LicensesDesktop: 0,
  LicensesMobile: 0,
};

const RenameCorporation = ({ name, disabled, success }) => {
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(DivisionValidationSchema),
    defaultValues: { Name: name },
  });

  useEffect(() => {
    reset({ Name: name });
  }, [visible]);

  const update = async (data) => {
    setBusy(true);
    try {
      await updateTenant(data);
      success(data.Name);
      setVisible(false);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Detail,
        life: 3000,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        className="mr-2"
        disabled={disabled}
        label={t('sts.txt.rename.company')}
        size="small"
        onClick={() => setVisible(true)}
      />
      <Dialog
        header={t('sts.txt.rename.company')}
        visible={visible}
        style={{ width: '35vw' }}
        onHide={() => setVisible(false)}
        closable={false}
      >
        <div className="flex">
          <i className="pi pi-question-circle text-blue-400 mr-3" style={{ fontSize: '2rem' }}></i>
          <div className="w-full">
            <p className="m-0 mb-2">{t('sts.txt.rename.company.msg', { 0: name })}</p>
            <Controller
              name="Name"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  {...field}
                  className={classNames({
                    'w-full': true,
                    required: true,
                    'p-invalid': fieldState.invalid,
                  })}
                  maxLength={FORM_DIVISION.fieldLength.Name}
                />
              )}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 my-4">
          <Button
            disabled={!isValid || !isDirty}
            loading={busy}
            label={t('sts.btn.ok')}
            size="small"
            onClick={handleSubmit(update)}
          />
          <Button label={t('sts.btn.cancel')} size="small" onClick={() => setVisible(false)} />
        </div>
      </Dialog>
    </>
  );
};

const DivisionLicenseManagement = () => {
  const { haveChanges, setHaveChanges } = useWindowControl(ROUTER_PATH.licenseManagement);
  const { t } = useTranslation();
  const { setAssociations, addHistoryLink } = useActions();
  const { refToast } = useContext(GlobalContext);
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({});
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const prevSelected = useRef();
  const tableRef = useRef();
  const { Edit, Delete, Create } = useGetPermissions(ScreenId.divisionManagement);
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(DivisionValidationSchema),
  });

  useEffect(() => {
    reset(selected);
  }, [selected]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (haveChanges) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.changed.data'),
        header: t('sts.txt.notice'),
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          init();
          setHaveChanges(false);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-yellow-500',
      });
    }
  }, [haveChanges]);

  const { scrollToSelectedIndex, selectedIndex } = useTableNavigation({ tableRef, hotKeys: false });

  const remainedLicenses = pageInfo.LicensesTotal - pageInfo.LicensesConsumed || 0;

  const init = async (data) => {
    setLoading(true);
    try {
      const res = await associationGetCollection();
      res.Entries = res.Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1));
      setPageInfo(res);
      setNameSuggestions(res.Entries.map((item) => ({ label: item.Name, value: item })));
      setAssociations(res);
      const ind = data ? res.Entries.indexOf(res.Entries.find(({ ID }) => ID === data.ID)) : 0;
      const cur = res.Entries[ind];
      setSelected(cur);
      if (!data && res.LicensesConsumed >= res.LicensesTotal) {
        confirmDialog({
          closable: false,
          message: t('1073'),
          header: 1073,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const matchName = async (prefix) => {
    const matched = pageInfo.Entries.filter(({ Name }) =>
      Name.toLowerCase().includes(prefix.toLowerCase()),
    );
    setNameSuggestions(matched.map((item) => ({ label: item.Name, value: item })));
  };

  const checkLicenses = (value, field) => {
    if (
      value +
        (pageInfo.LicensesConsumed - selected['LicensesDesktop'] - selected['LicensesMobile']) >
      pageInfo.LicensesTotal
    ) {
      confirmDialog({
        closable: false,
        message: t('1073'),
        header: 1073,
        acceptLabel: t('sts.btn.ok'),
        accept: () => {
          field.onChange(selected[field.name]);
        },
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
      return;
    }
  };

  const RenderTable = useCallback(
    (height) => {
      return (
        <DataTable
          loading={loading}
          removableSort
          ref={tableRef}
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
          }}
          onCopy={onCopy}
          scrollHeight={`${height}px`}
          scrollable
          value={pageInfo.Entries}
          totalRecords={pageInfo.length}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selectionMode="single"
          dataKey="ID"
          selection={selected}
          onRowClick={(e) => {
            selectedIndex.current = e.index;
          }}
          onSelectionChange={(e) => {
            setSelected(e.value);
          }}
          onColReorder={() => {}}
        >
          <Column
            headerTooltip={t('table.associations.association_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="Name"
            sortable
            header={t('table.associations.association_name')}
            bodyClassName={(data) =>
              classNames({
                'bg-red-100': data?.IsCorp,
              })
            }
          ></Column>
          <Column
            headerTooltip={t('table.associations.corp_account')}
            headerTooltipOptions={{ position: 'top' }}
            field="IsCorp"
            sortable
            header={t('table.associations.corp_account')}
            body={(data) => <Checkbox disabled checked={data?.IsCorp} />}
          ></Column>
          <Column
            headerTooltip={t('table.associations.corp_name')}
            headerTooltipOptions={{ position: 'top' }}
            field={'ID'}
            header={t('table.associations.corp_name')}
            body={() => pageInfo.CorpName}
          ></Column>
          <Column
            headerTooltip={t('table.associations.licenses_desktop')}
            headerTooltipOptions={{ position: 'top' }}
            field="LicensesDesktop"
            sortable
            header={t('table.associations.licenses_desktop')}
            bodyClassName={(data) =>
              classNames({
                'p-0': isEdit && selected.ID === data.ID,
              })
            }
            body={(data) =>
              isEdit && selected.ID === data.ID ? (
                <Controller
                  name="LicensesDesktop"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      value={field.value === '' ? null : field.value}
                      onChange={(e) => {
                        checkLicenses(e.value + getValues()['LicensesMobile'], field);
                        field.onChange(!e.value ? 1 : e.value);
                      }}
                      useGrouping={false}
                      className={classNames({
                        'w-full': true,
                      })}
                      min={selected.IsCorp ? 1 : 0}
                    />
                  )}
                />
              ) : (
                data.LicensesDesktop
              )
            }
          ></Column>
          <Column
            headerTooltip={t('table.associations.licenses_mobile')}
            headerTooltipOptions={{ position: 'top' }}
            field="LicensesMobile"
            sortable
            header={t('table.associations.licenses_mobile')}
            bodyClassName={(data) =>
              classNames({
                'p-0': isEdit && selected.ID === data.ID,
              })
            }
            body={(data) =>
              isEdit && selected.ID === data.ID && !selected.IsCorp ? (
                <Controller
                  name="LicensesMobile"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      value={field.value === '' ? null : field.value}
                      onChange={(e) => {
                        checkLicenses(e.value + getValues()['LicensesDesktop'], field);
                        field.onChange(e.value);
                      }}
                      useGrouping={false}
                      className={classNames({
                        'w-full': true,
                      })}
                    />
                  )}
                />
              ) : (
                data.LicensesMobile
              )
            }
          ></Column>
        </DataTable>
      );
    },
    [selected, isEdit, pageInfo],
  );

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
    scrollToSelectedIndex(selectedIndex.current);
  });

  const createNew = async (data) => {
    setBusy(true);
    try {
      const res = await associationCreate(data);
      init(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.division.created'),
        header: t('sts.txt.division.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: t('sts.label.association'),
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      } else {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const update = async (data) => {
    try {
      const res = await associationUpdate(data.ID, data);
      init(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.division.updated'),
        header: t('sts.txt.division.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: t('sts.label.association'),
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      } else {
        confirmDialog({
          closable: false,
          message: e.response.data.Detail,
          header: e.response.data.Message,
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteAssociation = async () => {
    try {
      await associationDelete(selected.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.division.delete', { 0: selected.Name }),
        header: t('sts.txt.division.remove'),
        rejectClassName: 'p-button-danger',
        acceptLabel: t('sts.txt.cancel'),
        rejectLabel: t('sts.txt.delete'),
        icon: 'pi pi-info-circle text-yellow-500',
        reject: () => {
          setTimeout(() => {
            confirmDialog({
              closable: false,
              message: t('1072'),
              acceptLabel: t('sts.btn.no'),
              acceptClassName: 'p-button-secondary',
              rejectLabel: t('sts.btn.yes'),
              rejectClassName: 'p-button-primary',
              icon: 'pi pi-question-circle text-blue-400',
              accept: async () => {
                try {
                  await associationDelete(selected.ID);
                  init(prevSelected.current);
                  setIsEdit(false);
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
              },
            });
          }, 100);
        },
      });
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

  const cancel = () => {
    const newEntries = [...pageInfo.Entries];
    if (!newEntries[0]?.ID) {
      newEntries.shift();
      setPageInfo({ ...pageInfo, Entries: newEntries });
      setSelected(selected?.ID ? selected : prevSelected.current);
      scrollToSelectedIndex();
      setIsEdit(false);
    } else {
      reset(selected);
      setIsEdit(false);
    }
  };

  const matchSelect = (value) => {
    setSelected(value);
    scrollToSelectedIndex(pageInfo.Entries.indexOf(value));
  };

  const NameFieldFlow = (value, field) => {
    const DIVISION = pageInfo.Entries.find(({ Name }) => Name === value);
    if (isEdit && DIVISION) {
      const newEntries = [...pageInfo.Entries];
      if (!newEntries[0].ID) {
        newEntries.shift();
        setPageInfo({ ...pageInfo, Entries: newEntries });
      }
      confirmDialog({
        closable: false,
        message: t('sts.txt.division.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(selected.Name);
        },
        reject: () => {
          matchSelect(DIVISION);
        },
      });
    } else {
      if (!DIVISION) {
        !isEdit && field.onChange(selected.Name);
      }
    }
  };

  return (
    <div id="division-management" className="fadein flex flex-column h-full p-3">
      <div className="flex justify-content-between align-items-center w-full mb-4">
        <div className="flex flex-wrap align-items-center">
          <div className="mr-4">
            <Button
              disabled={isEdit || !pageInfo?.CanChangeLicense || !Create}
              label={t('sts.btn.divisions.new')}
              size="small"
              onClick={() => {
                prevSelected.current = selected;
                const newEntries = [EMPTY, ...pageInfo.Entries];
                setPageInfo({ ...pageInfo, Entries: newEntries });
                setSelected(EMPTY);
                setIsEdit(true);
              }}
            />
          </div>
          <div className="flex align-items-center justify-content-between flex-shrink-0 mt-2">
            <h3 className="m-0">
              {t('sts.label.company.name')}: {pageInfo.CorpName}
            </h3>
          </div>
        </div>
        <GoToRootWindow />
      </div>
      <div className="flex align-items-center">
        <form className="p-fluid mr-4">
          <div className="my-1">
            <div className="flex align-items-center">
              <Controller
                name="Name"
                control={control}
                render={({ field, fieldState }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip id={`Name_${index}`} label={value.label} />
                    )}
                    disabled={!isEdit}
                    field="label"
                    completeMethod={(e) => matchName(e.query)}
                    suggestions={nameSuggestions}
                    onChange={(e) => {
                      field.onChange((e.value?.label || e.value).toUpperCase());
                    }}
                    onSelect={(e) => {
                      if (selected.Name !== e.value.label) {
                        NameFieldFlow(e.value.label, field);
                      }
                    }}
                    onBlur={(e) => {
                      field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                      setTimeout(() => {
                        if (selected.Name !== e.target.value) {
                          NameFieldFlow(e.target.value, field);
                        }
                      }, 400);
                    }}
                    className={classNames({
                      required: true,
                      'p-invalid': fieldState.invalid,
                    })}
                    maxLength={FORM_DIVISION.fieldLength.Name}
                  />
                )}
              />
            </div>
          </div>
        </form>
        <div className="flex justify-content-between align-items-center w-full">
          <div className="flex">
            ({remainedLicenses}) {pageInfo.LicensesConsumed || 0}/{pageInfo.LicensesTotal || 0}{' '}
            {t('sts.col.label.licenses.consumed')}
          </div>
          {isEdit && selected?.IsCorp && (
            <>
              <div className="flex">
                <RenameCorporation
                  name={pageInfo.CorpName}
                  success={(CorpName) => setPageInfo({ ...pageInfo, CorpName })}
                />
                <Button
                  disabled={!pageInfo?.CanChangeLicense}
                  label={t('sts.window.license.info')}
                  size="small"
                  onClick={() =>
                    addHistoryLink({
                      title: t('sts.window.license.info'),
                      path: `${window.origin}/${ROUTER_PATH.licenseManagement}`,
                      single: true,
                      singleID: `${window.origin}/${ROUTER_PATH.licenseManagement}`,
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex-auto">
        <AutoSizer className="flex-auto h-full w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-4">
        {isEdit ? (
          <>
            <Button
              disabled={selected?.IsCorp || !selected?.ID || !Delete}
              label={t('sts.btn.delete')}
              severity="danger"
              size="small"
              onClick={deleteAssociation}
            />
            <Button
              disabled={!isValid || !isDirty || (!selected?.ID ? !Create : !Edit)}
              loading={busy}
              label={t('sts.btn.save')}
              size="small"
              onClick={handleSubmit(!selected?.ID ? createNew : update)}
            />
            <Button label={t('sts.btn.cancel')} size="small" onClick={cancel} />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            size="small"
            disabled={!Edit && !Delete}
            severity="secondary"
            onClick={() => setIsEdit(true)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default DivisionLicenseManagement;
