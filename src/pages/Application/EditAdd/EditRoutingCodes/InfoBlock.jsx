import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';
import { PickList } from 'primereact/picklist';
import { ProgressSpinner } from 'primereact/progressspinner';

import { noNullValues, noSpaceOnStart, trimStartEnd } from 'utils';
import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { ContextEditEditRoutingCodes } from '.';
import {
  routingCodeCreate,
  routingCodeDelete,
  routingCodeGetById,
  routingCodeGetRefStatusCodes,
  routingCodeUpdate,
} from 'api';
import { removeEmptyParams } from 'api/general';
import { FORMS_CONFIG } from 'configs';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import { DEFAULT_ROW_HEIGHT } from 'const';

const RouterValidationSchema = yup.object({
  Code: yup.string().required(),
});

const InfoBlock = ({ current, created, updated, deleted, cancel }) => {
  const { refToast } = useContext(GlobalContext);
  const { accounts, matchSelect, setIsEdit, setIsNew, isEdit, isNew, Delete, Edit } = useContext(
    ContextEditEditRoutingCodes,
  );
  const { t } = useTranslation();
  const [routeInfo, setRouteInfo] = useState({});
  const [busy, setIsBusy] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState(false);
  const [statusCodes, setStatusCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const refPicker = useRef(null);
  const refRouteCodes = useRef([]);
  const refOriginStatuses = useRef([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(RouterValidationSchema),
  });

  useEffect(() => {
    refRouteCodes.current = accounts.map(({ Code, ID }) => ({ label: Code, value: ID }));
  }, [accounts]);

  useEffect(() => {
    if (current.ID) {
      loadRouterInfo();
    } else {
      setRouteInfo(current);
      reset(noNullValues(current));
      setStatusCodes(refOriginStatuses.current.filter(({ ID }) => ID));
    }
  }, [current]);

  const loadStatusCodes = async (data) => {
    try {
      const { Entries } = await routingCodeGetRefStatusCodes();
      refOriginStatuses.current = Entries.filter(({ IsActive }) => IsActive).sort((a, b) =>
        a.Name < b.Name ? -1 : 1,
      );
      setStatusCodes(refOriginStatuses.current.filter(({ ID }) => !data.StatusCodes.includes(ID)));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const loadRouterInfo = async () => {
    setLoading(true);
    try {
      const res = await routingCodeGetById(current.ID);
      res.ReadOnly && setIsEdit(false);
      setRouteInfo(res);
      loadStatusCodes(res);
      reset(noNullValues(res));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    reset(noNullValues(routeInfo));
    setStatusCodes(
      refOriginStatuses.current.filter(({ ID }) => !routeInfo.StatusCodes.includes(ID)),
    );
  }, [isEdit]);

  const createNew = async (data) => {
    try {
      setIsBusy(true);
      const res = await routingCodeCreate(noSpaceOnStart(removeEmptyParams(data)));
      created(res);
      setIsNew(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.route.created'),
        header: t('sts.txt.route.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
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
    } finally {
      setIsBusy(false);
    }
  };

  const update = async (data) => {
    try {
      setIsBusy(true);
      const res = await routingCodeUpdate(current.ID, noSpaceOnStart(removeEmptyParams(data)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.route.updated'),
        header: t('sts.txt.route.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
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
    } finally {
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    try {
      await routingCodeDelete(current.ID);
      setIsEdit(false);
      deleted();
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }
  };

  const deleteRoute = async () => {
    try {
      await routingCodeDelete(current.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.route.delete', {
          0: current.Code,
        }),
        header: t('sts.txt.route.remove'),
        icon: 'pi pi-exclamation-triangle text-yellow-500',
        rejectClassName: 'p-button-danger',
        acceptLabel: t('sts.btn.cancel'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.delete'),
        reject: () => {
          setTimeout(() => {
            confirmDialog({
              closable: false,
              message: t('1072'),
              acceptLabel: t('sts.btn.no'),
              acceptClassName: 'p-button-secondary',
              rejectLabel: t('sts.btn.yes'),
              rejectClassName: 'p-button-primary',
              accept: deleteRequest,
              icon: 'pi pi-question-circle text-blue-400',
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

  const pickerSourceItem = (value, field) => {
    const trigger = (e) => {
      e.preventDefault();
      (isEdit || isNew) &&
        refPicker.current.props.onChange({
          target: [...field.value, value.ID],
          source: statusCodes.filter(({ ID }) => ID !== value.ID),
        });
    };
    return (
      <div onContextMenu={trigger} onDoubleClick={trigger}>
        {value.Name}
      </div>
    );
  };

  const pickerTargetItem = (value, field) => {
    const trigger = (e) => {
      e.preventDefault();
      (isEdit || isNew) &&
        refPicker.current.props.onChange({
          target: field.value.filter((s) => s !== value.ID),
          source: [...statusCodes, value].sort((a, b) => (a.Name < b.Name ? -1 : 1)),
        });
    };
    return (
      <div onContextMenu={trigger} onDoubleClick={trigger}>
        {value.Name}
      </div>
    );
  };

  const matchCode = (prefix) => {
    setCodeSuggestions(
      refRouteCodes.current.filter(({ label }) =>
        label.toLowerCase().includes(prefix.toLowerCase()),
      ),
    );
  };

  const codeFieldFlow = (value, field) => {
    const CODE = accounts.find(({ Code }) => Code === value);
    if ((isNew || isEdit) && CODE) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.route.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(routeInfo.Code);
        },
        reject: () => {
          matchSelect(CODE);
        },
      });
    } else {
      if (!CODE) {
        !isEdit && !isNew && field.onChange(routeInfo.Code);
      } else {
        matchSelect(CODE);
      }
    }
  };

  return !Object.keys(routeInfo).length ? null : loading ? (
    <div className="h-full flex justify-content-center align-items-center">
      <ProgressSpinner
        style={{ width: '50px', height: '50px' }}
        pt={{
          circle: { style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' } },
        }}
      />
    </div>
  ) : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-end">
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column pb-2">
            <AutoSizer className="flex-auto w-full">
              {({ height }) => (
                <ScrollPanel
                  style={{ width: '100%', height: `${height}px` }}
                  pt={{
                    content: {
                      className: 'w-full',
                    },
                    bary: {
                      className: 'bg-bluegray-300',
                    },
                  }}
                >
                  <div className="flex-auto" style={{ width: 730, maxWidth: '100%' }}>
                    <form className="p-fluid">
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-3">{t('sts.label.route.code')}:</div>
                          <div className="flex align-items-center w-full">
                            <div className="w-6 mr-4">
                              <Controller
                                name="Code"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <AutoComplete
                                    {...field}
                                    virtualScrollerOptions={{
                                      itemSize: DEFAULT_ROW_HEIGHT,
                                    }}
                                    itemTemplate={(value, index) => (
                                      <DropdownItemTooltip
                                        id={`Code_${index}`}
                                        label={value.label}
                                      />
                                    )}
                                    field="label"
                                    dropdown
                                    onSelect={(e) => {
                                      if (routeInfo.Code !== e.value.label) {
                                        codeFieldFlow(e.value.label, field);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      field.onChange(trimStartEnd(e.target.value.toUpperCase()));
                                      setTimeout(() => {
                                        if (routeInfo.Code !== e.target.value) {
                                          codeFieldFlow(e.target.value, field);
                                        }
                                      }, 100);
                                    }}
                                    onChange={(e) => {
                                      field.onChange((e.value?.label || e.value).toUpperCase());
                                    }}
                                    autoHighlight
                                    completeMethod={(e) => matchCode(e.query)}
                                    suggestions={codeSuggestions}
                                    className={classNames({
                                      required: true,
                                      'w-full': true,
                                      'p-invalid': fieldState.invalid,
                                    })}
                                    maxLength={FORMS_CONFIG.FORM_ROUTING_CODE.fieldLength.Code}
                                  />
                                )}
                              />
                            </div>
                            <Controller
                              name="AllowAdditionalStatusCodes"
                              control={control}
                              render={({ field, fieldState }) => (
                                <>
                                  <Checkbox
                                    {...field}
                                    disabled={!isEdit && !isNew}
                                    inputId="RoutingDescription"
                                    checked={field.value}
                                    className={classNames({
                                      'p-invalid': fieldState.invalid,
                                    })}
                                  />
                                  <label htmlFor="RoutingDescription" className="ml-2">
                                    {t('sts.txt.scans.allow.more.status.codes')}
                                  </label>
                                </>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-3">{t('sts.label.description')}:</div>
                          <Controller
                            name="Desc"
                            control={control}
                            render={({ field, fieldState }) => (
                              <InputText
                                disabled={!isEdit && !isNew}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORMS_CONFIG.FORM_ROUTING_CODE.fieldLength.Description}
                              />
                            )}
                          />
                        </div>
                      </div>
                      {routeInfo.ReadOnly && <p className="text-red-500 mb-0">{t('1261')}</p>}
                      <div className="my-1">
                        <Controller
                          name="StatusCodes"
                          control={control}
                          render={({ field }) => (
                            <>
                              <div className="flex align-items-center">
                                <p className="mr-4">{t('sts.txt.code.right.click.select')}</p>
                                <div>
                                  <Button
                                    label={t('sts.btn.sort.by.process.id')}
                                    disabled={!isEdit && !isNew}
                                    size="small"
                                    type="button"
                                    onClick={() => {
                                      const res = field.value
                                        .map((ID) => ({
                                          ProcessID: refOriginStatuses.current.find(
                                            (code) => ID === code.ID,
                                          )?.ProcessID,
                                          ID,
                                        }))
                                        .sort((a, b) => a.ProcessID - b.ProcessID)
                                        .map(({ ID }) => ID);
                                      field.onChange(res);
                                    }}
                                  />
                                </div>
                              </div>
                              <PickList
                                ref={refPicker}
                                filterBy={isEdit || isNew ? 'Name' : null}
                                dataKey="ID"
                                showSourceControls={false}
                                showTargetControls={(isEdit || isNew) && !!field.value.length}
                                source={statusCodes}
                                target={field.value.map((ID) => ({
                                  Name:
                                    refOriginStatuses.current.find((code) => ID === code.ID)
                                      ?.Name || '',
                                  ID,
                                }))}
                                onChange={(e) => {
                                  if (e.target) {
                                    field.onChange(e.target.map((item) => item?.ID || item));
                                    setStatusCodes(e.source);
                                  }
                                }}
                                sourceItemTemplate={(value) => pickerSourceItem(value, field)}
                                targetItemTemplate={(value) => pickerTargetItem(value, field)}
                                sourceHeader={t('sts.txt.status.codes.available')}
                                targetHeader={t('sts.txt.status.codes.selected')}
                                sourceStyle={{ height: '30rem' }}
                                targetStyle={{ height: '30rem' }}
                                moveAllToTargetIcon={null}
                                pt={{
                                  buttons: {
                                    style: {
                                      width: 0,
                                      overflow: 'hidden',
                                      padding: 0,
                                      margin: 20,
                                    },
                                  },
                                  item: {
                                    style: {
                                      background: isEdit || isNew ? '' : 'transparent',
                                      color: '#000',
                                    },
                                  },
                                }}
                              />
                            </>
                          )}
                        />
                      </div>
                    </form>
                  </div>
                </ScrollPanel>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>
      <div className="flex justify-content-end gap-2">
        {isNew ? (
          <>
            <Button
              disabled={!isValid}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(createNew)}
            />
            <Button label={t('sts.btn.cancel')} disabled={busy} size="small" onClick={cancel} />
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.delete')}
              severity="danger"
              size="small"
              disabled={!Delete}
              onClick={deleteRoute}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
              }}
            />
          </>
        ) : (
          <Button
            disabled={routeInfo.ReadOnly || (!Edit && !Delete)}
            label={t('sts.btn.edit')}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
