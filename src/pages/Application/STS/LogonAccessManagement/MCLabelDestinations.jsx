import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import moment from 'moment';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';

import { debounce, onCopy } from 'utils';
import {
  getRefsMobileScreenLabels,
  getRefsPrinters,
  getRefsTemplates,
  userGetDuplicateUsers,
  userGetMCLabels,
  userSetMCLabels,
} from 'api';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import { permissionMainGetId } from 'api/api.permission';
import useWindowControl from 'hooks/useWindowControl';
import useTableNavigation from 'hooks/useTableNavigation';
import useSortTableAssist from 'hooks/useSortTableAssist';
import { DEFAULT_ROW_HEIGHT } from 'const';

const MCLabelDestinationsSchema = yup.object({
  MobileScreenID: yup.string().required(),
  PrinterID: yup.string().required(),
  TemplateID: yup.string().required(),
});

const MCLabelDestinations = () => {
  const { sendPost } = useWindowControl(window.opener?.name);
  const { id } = useParams();
  const { t } = useTranslation();
  const [initialTableHeight, setInitialTableHeight] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    Entries: [],
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [duplicateFrom, setDuplicateFrom] = useState({});
  const [duplicateUserSuggestions, setDuplicateUserSuggestions] = useState([]);
  const [screenSuggestions, setScreenSuggestions] = useState([]);
  const [printerSuggestions, setPrinterSuggestions] = useState([]);
  const [templateSuggestions, setTemplateSuggestions] = useState([]);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);

  const refScreens = useRef([]);
  const refPrinters = useRef([]);
  const refTemplates = useRef([]);
  const refDuplicateUsers = useRef([]);

  const refMobileScreenID = useRef(null);
  const refPrinterID = useRef(null);
  const refTemplateID = useRef(null);
  const refDupeUserID = useRef(null);
  const { Delete, Create, Edit } = useGetPermissions(ScreenId.mcLabelDestination);

  const tableRef = useRef();
  const refSelectedIndex = useRef(0);

  const DEFAULT_STATE = {
    MobileScreenID: '',
    PrinterID: '',
    TemplateID: '',
    DuplicateFromID: '',
  };

  const {
    control,
    reset,
    getValues,
    setError,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    defaultValues: DEFAULT_STATE,
    resolver: yupResolver(MCLabelDestinationsSchema),
  });

  useEffect(() => {
    getData();
  }, []);

  const { scrollToSelectedIndex } = useTableNavigation({ tableRef });

  const initForm = (data) => {
    if (data) {
      const { MobileScreenID, PrinterID, TemplateID } = data;
      reset({ MobileScreenID, PrinterID, TemplateID });
    }
  };

  const getData = async () => {
    try {
      const resScreens = await getRefsMobileScreenLabels();
      const resTemplates = await getRefsTemplates();

      refScreens.current = resScreens.Entries.sort((a, b) => (a.ID < b.ID ? -1 : 1)).map(
        (value) => value,
      );
      refTemplates.current = resTemplates.Entries.sort((a, b) => (a.ID < b.ID ? -1 : 1)).map(
        ({ ID }) => ID,
      );

      init();
    } finally {
      setLoading(false);
    }
  };

  const init = async (ID = id) => {
    try {
      setLoading(true);
      const res = await userGetMCLabels(ID);
      const SORTED = (res.Entries || []).sort((a, b) =>
        a.MobileScreenName < b.MobileScreenName ? -1 : 1,
      );
      setPageInfo({
        ...res,
        Entries: SORTED,
      });
      const CURR = SORTED[refSelectedIndex.current];
      refMobileScreenID.current = CURR?.MobileScreenID;
      refPrinterID.current = CURR?.PrinterID;
      refTemplateID.current = CURR?.TemplateID;
      setSelected(CURR);
      initForm(CURR);
      initDuplicateUsers(ID);
      checkIsValidParams(CURR);
    } catch (e) {
      confirmDialog({
        closable: false,
        header: e.response.data.Message,
        message: e.response.data.Detail,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setLoading(false);
    }
  };

  const initDuplicateUsers = async (ID) => {
    try {
      const resUsers = await userGetDuplicateUsers(ID);
      refDuplicateUsers.current = resUsers.Entries.sort((a, b) => (a.Name < b.Name ? -1 : 1)).map(
        ({ ID, Name, EmployeeName }) => ({
          label: Name,
          value: { ID, EmployeeName, Name },
        }),
      );
    } catch (e) {
      confirmDialog({
        closable: false,
        header: e.response.data.Message,
        message: e.response.data.Detail,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const matchScreen = (prefix = '') => {
    setScreenSuggestions(
      refScreens.current.filter(({ Name }) => Name.toLowerCase().includes(prefix.toLowerCase())),
    );
  };

  const matchPrinter = async (prefix = '') => {
    const { Entries } = await getRefsPrinters();
    refPrinters.current = Entries.sort((a, b) => (a.ID < b.ID ? -1 : 1));
    setPrinterSuggestions(
      refPrinters.current
        .map(({ ID }) => ID)
        .filter((ID) => ID.toLowerCase().includes(prefix.toLowerCase())),
    );
  };

  const matchTemplate = (prefix = '') => {
    setTemplateSuggestions(
      refTemplates.current.filter((ID) => ID.toLowerCase().includes(prefix.toLowerCase())),
    );
  };

  const matchDuplicateUser = (prefix = '') => {
    setDuplicateUserSuggestions(
      refDuplicateUsers.current.filter(({ label }) =>
        label.toLowerCase().includes(prefix.toLowerCase()),
      ),
    );
  };

  const dbHeight = debounce((val) => {
    setInitialTableHeight(val);
  });

  const { sortMeta, sortTableParams, iconStatus } = useSortTableAssist({ tableRef });

  const RenderTable = useCallback(
    (height) => {
      return (
        <DataTable
          ref={tableRef}
          onCopy={onCopy}
          loading={loading}
          removableSort
          virtualScrollerOptions={{
            itemSize: DEFAULT_ROW_HEIGHT,
            appendOnly: true,
          }}
          scrollHeight={`${height}px`}
          scrollable
          value={pageInfo.Entries}
          totalRecords={pageInfo.Entries.length}
          resizableColumns
          columnResizeMode="expand"
          reorderableColumns
          showGridlines
          size="small"
          selectionMode="single"
          dataKey="MobileScreenName"
          selection={selected}
          onRowClick={(e) => {
            refSelectedIndex.current = e.index;
          }}
          onSelectionChange={(e) => {
            refMobileScreenID.current = e.value.MobileScreenID;
            refPrinterID.current = e.value.PrinterID;
            refTemplateID.current = e.value.TemplateID;
            setSelected(e.value);
            initForm(e.value);
            checkIsValidParams(e.value);
          }}
          onSort={sortTableParams}
          sortIcon={iconStatus}
          sortField={sortMeta?.sortField}
          sortOrder={sortMeta?.sortOrder}
        >
          <Column
            headerTooltip={t('table.label_destinations.rf_screen_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="MobileScreenName"
            sortable
            body={({ MobileScreenID }) => t(MobileScreenID)}
            header={t('table.label_destinations.rf_screen_name')}
          ></Column>
          <Column
            headerTooltip={t('table.label_destinations.printer_name')}
            headerTooltipOptions={{ position: 'top' }}
            field="PrinterName"
            sortable
            header={t('table.label_destinations.printer_name')}
            bodyStyle={{ maxWidth: 100 }}
            body={(data) => (
              <span className={`${data.IsPrinterValid ? '' : 'text-red-400'}`}>
                {data.PrinterName}
              </span>
            )}
          ></Column>
          <Column
            headerTooltip={t('table.label_destinations.label_template_name')}
            headerTooltipOptions={{ position: 'top' }}
            sortable
            field={'TemplateName'}
            header={t('table.label_destinations.label_template_name')}
            bodyStyle={{ maxWidth: 100 }}
            body={(data) => (
              <span className={`${data.IsTemplateValid ? '' : 'text-red-400'}`}>
                {data.TemplateName}
              </span>
            )}
          ></Column>
          <Column
            headerTooltip={t('table.label_destinations.edit_date')}
            headerTooltipOptions={{ position: 'top' }}
            sortable
            field={'EditedDate'}
            header={t('table.label_destinations.edit_date')}
            body={(data) => moment(data.EditedDate).format('L')}
          ></Column>
          <Column
            headerTooltip={t('table.label_destinations.create_date')}
            headerTooltipOptions={{ position: 'top' }}
            sortable
            field={'CreatedDate'}
            header={t('table.label_destinations.create_date')}
            body={(data) => moment(data.CreatedDate).format('L')}
          ></Column>
        </DataTable>
      );
    },
    [selected, pageInfo, sortMeta],
  );

  const fullFillFromDuplicateUser = async () => {
    try {
      setLoading(true);
      setUpdating(true);
      await save(duplicateFrom.ID, null, setUpdating);
      setDuplicateFrom({});
      refDupeUserID.current = null;
    } catch (e) {
      confirmDialog({
        closable: false,
        header: e.response.data.Message,
        message: e.response.data.Detail || e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  const createNew = async ({ MobileScreenID, PrinterID, TemplateID }) => {
    const DATA = [
      ...pageInfo.Entries.map(({ MobileScreenID, PrinterID, TemplateID }) => ({
        MobileScreenID,
        PrinterID,
        TemplateID,
      })),
      {
        MobileScreenID,
        PrinterID,
        TemplateID,
      },
    ];
    save(DATA, MobileScreenID, setAdding);
  };

  const update = async (data) => {
    const DATA = [
      ...pageInfo.Entries.map(({ MobileScreenID, PrinterID, TemplateID }) => ({
        MobileScreenID:
          MobileScreenID !== data.MobileScreenID ? MobileScreenID : data.MobileScreenID,
        PrinterID: MobileScreenID !== data.MobileScreenID ? PrinterID : data.PrinterID,
        TemplateID: MobileScreenID !== data.MobileScreenID ? TemplateID : data.TemplateID,
      })),
    ];
    save(DATA, data.MobileScreenID, setUpdating);
  };

  const deleteLabel = async () => {
    const res = await permissionMainGetId(ScreenId.mcLabelDestination);
    if (!res.Other.Delete) {
      return confirmDialog({
        closable: false,
        header: t('sts.txt.error.no.permissions'),
        message: t('sts.txt.error.no.permissions'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } else {
      confirmDialog({
        closable: false,
        message: t('sts.label.label_destination.delete'),
        header: t('sts.label.label_destination.remove'),
        icon: 'pi pi-exclamation-triangle text-yellow-500',
        rejectClassName: 'p-button-danger',
        acceptLabel: t('sts.btn.cancel'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.delete'),
        reject: () => {
          refSelectedIndex.current = 0;
          save(
            pageInfo.Entries.filter((item) => item.MobileScreenID !== selected.MobileScreenID).map(
              ({ MobileScreenID, PrinterID, TemplateID }) => ({
                MobileScreenID,
                PrinterID,
                TemplateID,
              }),
            ),
          );
        },
      });
    }
  };

  const save = async (data, updatedID, setActionState = () => {}) => {
    try {
      setLoading(true);
      setActionState(true);
      const sendData =
        typeof data === 'string'
          ? {
              DuplicateFromID: data,
            }
          : {
              Entries: data,
            };
      const { Entries } = await userSetMCLabels(id, sendData);
      const SORTED = Entries.sort((a, b) => (a.MobileScreenName < b.MobileScreenName ? -1 : 1));
      setPageInfo({ ...pageInfo, Entries: SORTED });
      const ind = updatedID
        ? SORTED.indexOf(SORTED.find(({ MobileScreenID }) => updatedID === MobileScreenID))
        : 0;
      const CURR = SORTED[ind];
      refMobileScreenID.current = CURR.MobileScreenID;
      refPrinterID.current = CURR.PrinterID;
      refTemplateID.current = CURR.TemplateID;
      setSelected(CURR);
      initForm(CURR);
      checkIsValidParams(CURR);
      sendPost({ changed: true });
    } catch (e) {
      confirmDialog({
        closable: false,
        header: e.response.data.Message,
        message: e.response.data.Detail || e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setLoading(false);
      setActionState(false);
    }
  };

  const cancel = () => {
    refMobileScreenID.current = selected?.MobileScreenID;
    refPrinterID.current = selected?.PrinterID;
    refTemplateID.current = selected?.TemplateID;
    refDupeUserID.current = null;
    setSelected(pageInfo.Entries[refSelectedIndex.current]);
    initForm(pageInfo.Entries[refSelectedIndex.current] || DEFAULT_STATE);
    checkIsValidParams(pageInfo.Entries[refSelectedIndex.current]);
    setDuplicateFrom({});
  };

  const FieldMobileScreenFlow = (value, field) => {
    if (value !== selected?.MobileScreenID) {
      if (!screenSuggestions.find(({ ID }) => ID === value)) {
        reset({
          ...getValues(),
          MobileScreenID: refMobileScreenID.current,
        });
        return;
      }

      const MATCH = pageInfo.Entries.find(({ MobileScreenID }) => MobileScreenID === value);
      if (MATCH) {
        refSelectedIndex.current = pageInfo.Entries.indexOf(MATCH);
        refMobileScreenID.current = MATCH.MobileScreenID;
        refPrinterID.current = MATCH.PrinterID;
        refTemplateID.current = MATCH.TemplateID;
        setSelected(MATCH);
        initForm(MATCH);
        scrollToSelectedIndex();
      } else {
        if (selected) {
          checkIsValidParams(selected);
          setSelected(null);
        }
        field.onChange(value);
        refMobileScreenID.current = null;
      }
    }
  };

  const checkIsValidParams = (data) => {
    if (data) {
      if (!data.IsPrinterValid) {
        setError('PrinterID', {
          type: 'validate',
          message: 'PrinterID',
        });
      }
      if (!data.IsTemplateValid) {
        setError('TemplateID', {
          type: 'validate',
          message: 'TemplateID',
        });
      }
    }
  };

  return (
    <div id="mc-label-destinations" className="fadein flex flex-column h-full p-3">
      <div className="flex justify-content-between align-items-center">
        <div />
        <GoToRootWindow />
      </div>
      <div className="">
        <form>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('sts.label.login.name')}:</div>
              <div className="w-full flex justify-content-between">
                <span className="mr-4">{pageInfo.UserName}</span>
                {duplicateFrom.ID && (
                  <h4 className="m-0">
                    {t('sts.txt.duped.settings.source')}: {duplicateFrom.EmployeeName}
                  </h4>
                )}
              </div>
            </div>
          </div>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('sts.label.employee.number.name')}:</div>
              <div className="w-full">{pageInfo.EmployeeName}</div>
            </div>
          </div>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('sts.label.c.screen.name')}:</div>
              <Controller
                name="MobileScreenID"
                control={control}
                render={({ field, fieldState }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip id={`MobileScreenID_${index}`} label={value.Name} />
                    )}
                    field="Name"
                    dropdown
                    value={t(field.value)}
                    onSelect={(e) => {
                      FieldMobileScreenFlow(e.value.ID, field);
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        FieldMobileScreenFlow(
                          screenSuggestions.find(({ Name }) => Name === e.target.value)?.ID,
                          field,
                        );
                      }, 100);
                    }}
                    completeMethod={(e) => matchScreen(e.query)}
                    suggestions={screenSuggestions}
                    className={classNames({
                      required: true,
                      'w-full': true,
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
            </div>
          </div>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('sts.label.printer')}:</div>
              <Controller
                name="PrinterID"
                control={control}
                render={({ field, fieldState }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip
                        id={`PrinterID_${index}`}
                        label={`${value}${
                          refPrinters.current.find(({ ID }) => ID === value)?.IsDefault
                            ? ' (Default)'
                            : ''
                        }`}
                      />
                    )}
                    dropdown
                    onSelect={(e) => {
                      field.onChange(e.value);
                      refPrinterID.current = e.value;
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        const MATCH = pageInfo.Entries.find(
                          ({ PrinterID }) => PrinterID === e.target.value,
                        );
                        if (!MATCH) {
                          reset({
                            ...getValues(),
                            [field.name]: refPrinterID.current,
                          });
                        }
                      }, 100);
                    }}
                    completeMethod={(e) => matchPrinter(e.query)}
                    suggestions={printerSuggestions}
                    className={classNames({
                      required: true,
                      'w-full': true,
                      'p-invalid': fieldState.invalid,
                    })}
                    inputStyle={{
                      background:
                        fieldState.error?.message === field.name ? 'var(--lightRed-500)' : '',
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('table.label_destinations.label_template_name')}:</div>
              <Controller
                name="TemplateID"
                control={control}
                render={({ field, fieldState }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip id={`PrinterID_${index}`} label={value} />
                    )}
                    dropdown
                    onSelect={(e) => {
                      field.onChange(e.value);
                      refTemplateID.current = e.value;
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        const MATCH = pageInfo.Entries.find(
                          ({ TemplateID }) => TemplateID === e.target.value,
                        );
                        if (!MATCH) {
                          reset({
                            ...getValues(),
                            [field.name]: refTemplateID.current,
                          });
                        }
                      }, 100);
                    }}
                    completeMethod={(e) => matchTemplate(e.query)}
                    suggestions={templateSuggestions}
                    className={classNames({
                      required: true,
                      'w-full': true,
                      'p-invalid': fieldState.invalid,
                    })}
                    inputStyle={{
                      background:
                        fieldState.error?.message === field.name ? 'var(--lightRed-500)' : '',
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="my-2">
            <div className="flex align-items-center">
              <div className="mr-4 w-7">{t('sts.txt.duped.from.user')}:</div>
              <Controller
                name="DuplicateFromID"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    virtualScrollerOptions={{
                      itemSize: DEFAULT_ROW_HEIGHT,
                    }}
                    itemTemplate={(value, index) => (
                      <DropdownItemTooltip id={`DuplicateFromID_${index}`} label={value.label} />
                    )}
                    field="label"
                    dropdown
                    onSelect={(e) => {
                      field.onChange(e.value.label);
                      setDuplicateFrom(e.value.value);
                      refDupeUserID.current = e.value.label;
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (duplicateFrom?.Name && e.target.value !== duplicateFrom.Name) {
                          const MATCH = duplicateUserSuggestions.find(
                            ({ label }) => label === e.target.value,
                          );
                          if (!MATCH) {
                            reset({
                              ...getValues(),
                              [field.name]: refDupeUserID.current,
                            });
                          } else {
                            field.onChange(MATCH.label);
                            refDupeUserID.current = MATCH.label;
                            setDuplicateFrom(MATCH.value);
                          }
                        }
                      }, 100);
                    }}
                    completeMethod={(e) => matchDuplicateUser(e.query)}
                    suggestions={duplicateUserSuggestions}
                    className={classNames({
                      'w-full': true,
                    })}
                  />
                )}
              />
            </div>
          </div>
        </form>
        <div className="flex justify-content-end align-items-center mb-2 h-3rem">
          {(selected?.MobileScreenID || duplicateFrom.ID) && (
            <Button
              disabled={
                (!isDirty &&
                  !duplicateFrom.ID &&
                  selected?.PrinterID === refPrinterID.current &&
                  selected?.TemplateID === refTemplateID.current) ||
                (duplicateFrom.ID ? !Create : !Edit)
              }
              loading={updating}
              label={t('sts.btn.update')}
              size="small"
              onClick={duplicateFrom.ID ? fullFillFromDuplicateUser : handleSubmit(update)}
            />
          )}
          {!duplicateFrom.ID &&
            !pageInfo.Entries.find(
              ({ MobileScreenID }) => MobileScreenID === refMobileScreenID.current,
            ) && (
              <Button
                disabled={!isValid || !Create}
                loading={adding}
                label={t('sts.btn.add')}
                size="small"
                onClick={handleSubmit(createNew)}
              />
            )}
        </div>
      </div>
      <div className="flex-auto">
        <AutoSizer className="flex-auto w-full">
          {({ height }) => {
            height !== initialTableHeight && dbHeight(height);
            return height !== initialTableHeight ? null : RenderTable(height);
          }}
        </AutoSizer>
      </div>
      <div className="flex justify-content-end gap-2 mt-4">
        {selected?.PrinterID && (
          <Button
            label={t('sts.btn.delete')}
            severity="danger"
            size="small"
            disabled={!Delete}
            onClick={deleteLabel}
          />
        )}
        <Button label={t('sts.btn.cancel')} size="small" onClick={cancel} />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default MCLabelDestinations;
