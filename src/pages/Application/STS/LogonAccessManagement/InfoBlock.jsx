import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import moment from 'moment';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { AutoComplete } from 'primereact/autocomplete';

import { FORMS_CONFIG } from 'configs';
import {
  getRefsAssociations,
  getRefsEmployee,
  getRefsMobileScreens,
  getRefsNames,
  getRefsPermissionGroups,
  userById,
  userDelete,
  userNew,
  userUpdate,
} from 'api';
import { removeEmptyParams } from 'api/general';
import { noNullValues, noSpaceOnStart, trimAll } from 'utils';

import { ContextLogonAccessManagement } from '.';
import { GlobalContext } from 'pages/Application';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { FORM_LOGON_ACCESS } from 'configs/forms.config';
import ROUTER_PATH from 'const/router.path';
import useActions from 'hooks/useActions';
import DropdownItemTooltip from 'components/DropdownItemTooltip';
import useWindowControl from 'hooks/useWindowControl';
import { DEFAULT_ROW_HEIGHT } from 'const';

const UserValidationSchema = yup.object({
  Name: yup.string().trim().required(),
  PermissionGroupID: yup.string().trim().required(),
  AssociationID: yup.string().trim().required(),
  EmployeeID: yup.string().trim().required(),
  Password: yup.string().matches(/^\S*$/).required(),
  ConfirmPassword: yup
    .string()
    .matches(/^\S*$/)
    .oneOf([yup.ref('Password'), null]),
});

const InfoBlock = ({ current, cancel, created, updated, deleted }) => {
  const { haveChanges, setHaveChanges } = useWindowControl(window.name);
  const { addHistoryLink } = useActions();
  const { refToast } = useContext(GlobalContext);
  const { setIsEdit, isEdit, isNew, matchSelect, accounts, withInactive, Edit, Delete } =
    useContext(ContextLogonAccessManagement);
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState({});
  const [busy, setIsBusy] = useState(false);
  const [nameSuggestions, setNamesSuggestions] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [mobileScreens, setMobileScreens] = useState([]);
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isValid, isDirty, dirtyFields },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(UserValidationSchema),
  });
  const refEmployee = useRef(null);
  const refFullListOfNames = useRef([]);

  const PasswordWatcher = useWatch({ control, name: 'Password' });
  const ConfirmPasswordWatcher = useWatch({ control, name: 'ConfirmPassword' });

  const isLastCorpActive =
    accounts.filter(({ AssociationName, IsActive }) => AssociationName === 'CORP' && IsActive)
      .length === 1 &&
    userInfo.IsCorp &&
    userInfo.IsActive;

  useEffect(() => {
    if (dirtyFields.Password) {
      if (PasswordWatcher === ConfirmPasswordWatcher && PasswordWatcher !== userInfo.Password) {
        setValue('IsActive', true);
      } else {
        setValue('IsActive', false);
      }
    }
  }, [PasswordWatcher, ConfirmPasswordWatcher]);

  useEffect(() => {
    if (current.ID) {
      loadUserInfo();
    } else {
      refEmployee.current = null;
      setUserInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  useEffect(() => {
    reset(noNullValues(userInfo));
  }, [isEdit]);

  useEffect(() => {
    getAllNames();
    initPermissions();
    initMobileScreens();
  }, []);

  const getAllNames = async () => {
    try {
      const { Entries } = await getRefsNames({ with_inactive: true });
      refFullListOfNames.current = Entries;
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const initPermissions = async () => {
    try {
      const { Entries } = await getRefsPermissionGroups();
      setPermissionGroups(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const initMobileScreens = async () => {
    try {
      const { Entries } = await getRefsMobileScreens();
      setMobileScreens(Entries);
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const loadUserInfo = async () => {
    try {
      const { Entries } = await getRefsAssociations();
      setAssociations(Entries);
      const user = await userById(current.ID);
      setUserInfo(user);
      reset(noNullValues({ ...user, ConfirmPassword: user.Password }));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const matchName = async (prefix) => {
    try {
      const { Entries } = await getRefsNames({ prefix, with_inactive: withInactive });
      setNamesSuggestions(Entries.map((item) => ({ label: item.Name, value: item })));
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const matchEmployee = async (prefix) => {
    try {
      const { Entries } = await getRefsEmployee({ prefix });
      setEmployeeSuggestions(
        Entries.map(({ Name, ID }) => ({
          label: Name,
          value: ID,
        })),
      );
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response?.data.Message,
        life: 3000,
      });
    }
  };

  const createNew = async (data) => {
    try {
      setIsBusy(true);
      const res = await userNew(
        noSpaceOnStart(
          removeEmptyParams({ ...data, PermissionGroupID: Number(data.PermissionGroupID) }),
        ),
      );
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.user.created'),
        header: t('sts.txt.user.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: t('sts.txt.logon'),
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          accept: () => {
            setValue('Name', '');
          },
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
      setIsBusy(false);
    }
  };

  const update = async (data) => {
    if (userInfo.Password === data.Password) {
      delete data.Password;
      delete data.ConfirmPassword;
    }
    try {
      setIsBusy(true);
      const res = await userUpdate(
        current.ID,
        noSpaceOnStart(
          removeEmptyParams({ ...data, PermissionGroupID: Number(data.PermissionGroupID) }),
        ),
      );
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.user.updated'),
        header: t('sts.txt.user.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: t('sts.txt.logon'),
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          accept: () => {
            setValue('Name', userInfo.Name);
          },
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
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    if (isLastCorpActive) {
      setTimeout(() => {
        confirmDialog({
          closable: false,
          header: t('sts.txt.remove.selected.record'),
          message: t('sts.txt.user.delete.last.active'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-exclamation-triangle text-yellow-500',
        });
      }, 100);
      return;
    }
    try {
      await userDelete(userInfo.ID);
      setIsEdit(false);
      deleted();
    } catch (e) {
      refToast.current?.show({
        severity: 'error',
        summary: t('sts.txt.error'),
        detail: e.response.data.Message,
        life: 3000,
      });
    }
  };

  const deleteUser = () => {
    if (userInfo.IsAdminAccount) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.account.corp'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-exclamation-triangle text-yellow-500',
      });
      return;
    }
    confirmDialog({
      closable: false,
      message: t('sts.txt.delete.account', { 0: userInfo.Name, 1: '' }),
      header: t('sts.txt.remove.selected.record'),
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
  };

  const LoginNameFieldFlow = async (value, field) => {
    const USER = accounts.find(({ Name }) => Name === value);
    if ((isNew || isEdit) && USER) {
      confirmDialog({
        closable: false,
        message: t('sts.txt.user.exist', { 0: value }),
        acceptLabel: t('sts.btn.no'),
        acceptClassName: 'p-button-secondary',
        rejectLabel: t('sts.btn.yes'),
        rejectClassName: 'secondary',
        icon: 'pi pi-question-circle text-blue-400',
        accept: () => {
          field.onChange(userInfo.Name);
        },
        reject: () => {
          matchSelect(USER);
        },
      });
    } else {
      if (!USER) {
        refFullListOfNames.current.find(({ Name }) => Name === value) &&
          confirmDialog({
            closable: false,
            header: t('sts.txt.account.is.inactive'),
            message: t('sts.txt.account.is.inactive'),
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-exclamation-triangle text-yellow-500',
            accept: () => {
              field.onChange(userInfo.Name);
            },
          });
        !isEdit && !isNew && field.onChange(userInfo.Name);
      } else {
        matchSelect(USER);
      }
    }
  };

  return !Object.keys(userInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-between align-items-center">
        <div />
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <div className="h-full flex flex-column">
          <div className="h-full flex flex-column pb-2">
            <AutoSizer className="flex-auto w-full">
              {({ height }) => (
                <ScrollPanel
                  style={{ height: `${height}px` }}
                  pt={{
                    content: {
                      className: 'p-0 flex gap-2',
                    },
                    bary: {
                      className: 'bg-bluegray-300',
                    },
                  }}
                >
                  <div className="w-30rem">
                    <form>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4" />
                          <div className="flex align-items-center w-full">
                            <Controller
                              name="IsActive"
                              control={control}
                              render={({ field }) => (
                                <div className="flex align-items-center">
                                  <Checkbox
                                    {...field}
                                    disabled={(!isNew && !isEdit) || isLastCorpActive}
                                    inputId="isActive"
                                    checked={field.value}
                                  />
                                  <label htmlFor="isActive" className="ml-2 mr-2">
                                    {t('table.users.is_account_active')}
                                  </label>
                                </div>
                              )}
                            />
                            {/* <Controller
                              name="UseDualEntry"
                              control={control}
                              render={({ field }) => (
                                <div className="flex align-items-center">
                                  <Checkbox
                                    {...field}
                                    disabled={!isNew && !isEdit}
                                    inputId="UseDualEntry"
                                    checked={field.value}
                                  />
                                  <label htmlFor="UseDualEntry" className="ml-2">
                                    {t('sts.chk.use.dual.entry')}
                                  </label>
                                </div>
                              )}
                            /> */}
                          </div>
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('table.users.user_name')}:</div>
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
                                dropdown
                                onChange={(e) => {
                                  field.onChange(e.value?.label || e.value);
                                }}
                                onSelect={(e) => {
                                  if (userInfo.Name !== e.value) {
                                    LoginNameFieldFlow(e.value.label, field);
                                  }
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    if (userInfo.Name !== e.target.value) {
                                      field.onChange(trimAll(e.target.value));
                                      LoginNameFieldFlow(e.target.value, field);
                                    }
                                  }, 400);
                                }}
                                field="label"
                                completeMethod={(e) => matchName(e.query)}
                                suggestions={nameSuggestions}
                                className={classNames({
                                  required: true,
                                  'w-full': true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                maxLength={FORM_LOGON_ACCESS.fieldLength.LoginName}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4"></div>
                          <Controller
                            name="IsAdminAccount"
                            control={control}
                            render={({ field }) => (
                              <div className="flex align-items-center w-full">
                                <Checkbox
                                  {...field}
                                  disabled={!isNew && !isEdit}
                                  inputId="IsAdminAccount"
                                  checked={field.value}
                                />
                                <label htmlFor="IsAdminAccount" className="ml-2">
                                  {t('sts.chk.admin.login')}
                                </label>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('sts.label.division')}:</div>
                          <Controller
                            name="AssociationID"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Dropdown
                                disabled={!isNew && !isEdit}
                                id={field.name}
                                {...field}
                                onChange={(e) => {
                                  if (
                                    associations.find(({ ID }) => ID === e.value).Name === 'CORP'
                                  ) {
                                    setValue('MobileComputerIDs', []);
                                  }
                                  field.onChange(e.value);
                                }}
                                options={associations?.map(({ ID, Name }) => ({
                                  label: Name,
                                  value: ID,
                                }))}
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
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4"></div>
                          <Controller
                            name="IsReportWriterAdmin"
                            control={control}
                            render={({ field }) => (
                              <div className="flex align-items-center w-full">
                                <Checkbox
                                  {...field}
                                  disabled={!isNew && !isEdit}
                                  inputId="IsReportWriterAdmin"
                                  checked={field.value}
                                />
                                <label htmlFor="IsReportWriterAdmin" className="ml-2">
                                  {t('sts.chk.report.writer.admin')}
                                </label>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('sts.label.employee.num')}:</div>
                          <Controller
                            name="EmployeeName"
                            control={control}
                            render={({ field, fieldState }) => (
                              <AutoComplete
                                {...field}
                                disabled={!isNew && !isEdit}
                                virtualScrollerOptions={{
                                  itemSize: DEFAULT_ROW_HEIGHT,
                                }}
                                itemTemplate={(value, index) => (
                                  <DropdownItemTooltip
                                    id={`EmployeeName_${index}`}
                                    label={value.label}
                                  />
                                )}
                                dropdown
                                autoHighlight
                                field="label"
                                onFocus={(e) => {
                                  if (!refEmployee.current) {
                                    refEmployee.current = e.target.value;
                                  }
                                }}
                                onSelect={(e) => {
                                  if (userInfo.EmployeeName !== e.value.label) {
                                    field.onChange(e.value.label);
                                    setValue('EmployeeID', e.value.value, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                    refEmployee.current = null;
                                  }
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    if (
                                      refEmployee.current &&
                                      userInfo.EmployeeName !== e.target.value
                                    ) {
                                      field.onChange(refEmployee.current);
                                      refEmployee.current = null;
                                    }
                                  }, 400);
                                }}
                                completeMethod={(e) => matchEmployee(e.query)}
                                suggestions={employeeSuggestions}
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
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('table.users.name_first')}:</div>
                          <Controller
                            name="Description"
                            control={control}
                            render={({ field }) => (
                              <InputText
                                disabled={!isNew && !isEdit}
                                {...field}
                                className={classNames({
                                  'w-full': true,
                                })}
                                maxLength={FORMS_CONFIG.FORM_LOGON_ACCESS.fieldLength.Description}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('sts.label.password')}:</div>
                          <Controller
                            name="Password"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Password
                                disabled={!isNew && !isEdit}
                                toggleMask
                                feedback={false}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(trimAll(e.target.value));
                                }}
                                className={classNames({
                                  'w-full': true,
                                  required: true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                inputClassName="w-full"
                                maxLength={FORMS_CONFIG.FORM_LOGON_ACCESS.fieldLength.Password}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        <div className="flex align-items-center">
                          <div className="mr-4 w-4">{t('sts.label.password.confirm')}:</div>
                          <Controller
                            name="ConfirmPassword"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Password
                                disabled={!isNew && !isEdit}
                                feedback={false}
                                toggleMask
                                {...field}
                                onChange={(e) => {
                                  field.onChange(trimAll(e.target.value));
                                }}
                                className={classNames({
                                  'w-full': true,
                                  required: true,
                                  'p-invalid': fieldState.invalid,
                                })}
                                inputClassName="w-full"
                                maxLength={FORMS_CONFIG.FORM_LOGON_ACCESS.fieldLength.Password}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="my-1">
                        {isNew ? null : (
                          <div className="flex align-items-center">
                            <div className="mr-4 w-4">{t('table.users.last_login')}:</div>
                            <div className="flex align-items-center w-full">
                              {!userInfo.LastLogin
                                ? null
                                : `${moment(userInfo.LastLogin).format('l')} ${moment(
                                    userInfo.LastLogin,
                                  ).format('LT')}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="w-13rem">
                    <p className="m-2">{t('sts.label.permission.groups')}</p>
                    <div
                      className={classNames({
                        'p-1': true,
                        required: true,
                        'p-disabled': !isNew && !isEdit,
                      })}
                    >
                      <Controller
                        name="PermissionGroupID"
                        control={control}
                        render={({ field }) =>
                          permissionGroups.map(({ ID, Name }) => (
                            <div key={ID} className="flex align-items-center my-2">
                              <Checkbox
                                disabled={!isNew && !isEdit}
                                {...field}
                                inputId={ID}
                                value={ID}
                                checked={field.value === ID}
                                onChange={(e) => {
                                  field.onChange(e.value);
                                }}
                              />
                              <label
                                htmlFor={ID}
                                className="ml-2"
                                style={{ wordBreak: 'break-all' }}
                              >
                                {Name}
                              </label>
                            </div>
                          ))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="m-2">{t('sts.label.remote.views')}</p>
                    <Controller
                      name="MobileComputerIDs"
                      control={control}
                      render={({ field }) => (
                        <>
                          <div key={'none'} className="flex align-items-center mb-2">
                            <Checkbox
                              disabled={
                                (!isNew && !isEdit) ||
                                associations.find(({ ID }) => ID === getValues().AssociationID)
                                  ?.Name === 'CORP'
                              }
                              {...field}
                              inputId={'none'}
                              checked={!field.value?.length}
                              onChange={(e) => {
                                if (e.checked) {
                                  field.onChange([]);
                                  return;
                                }
                                field.onChange(field.value.filter((ID) => e.value !== ID));
                              }}
                            />
                            <label
                              htmlFor={'none'}
                              className="ml-2"
                              style={{ wordBreak: 'break-all' }}
                            >
                              {t('sts.status.noneTr')}
                            </label>
                          </div>
                          {mobileScreens.map(({ ID, Name }) => (
                            <div key={ID} className="flex align-items-center mb-2">
                              <Checkbox
                                disabled={
                                  (!isNew && !isEdit) ||
                                  associations.find(({ ID }) => ID === getValues().AssociationID)
                                    ?.Name === 'CORP'
                                }
                                {...field}
                                inputId={ID}
                                value={ID}
                                checked={field.value?.includes(ID)}
                                onChange={(e) => {
                                  if (e.checked) {
                                    field.onChange([...field.value, e.value]);
                                    return;
                                  }
                                  field.onChange(field.value.filter((ID) => e.value !== ID));
                                }}
                              />
                              <label
                                htmlFor={ID}
                                className="ml-2"
                                style={{ wordBreak: 'break-all' }}
                              >
                                {Name}
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                    />
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
              disabled={!Delete}
              severity="danger"
              size="small"
              onClick={deleteUser}
            />
            <Button
              disabled={(!isValid || !isDirty || !Edit) && !haveChanges}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={() => {
                if (isDirty) handleSubmit(update)();
                if (haveChanges) setHaveChanges(false);
                if (haveChanges && !isDirty) {
                  setIsEdit(false);
                  confirmDialog({
                    closable: false,
                    message: t('sts.txt.user.updated'),
                    header: t('sts.txt.user.updated'),
                    acceptLabel: t('sts.btn.ok'),
                    rejectClassName: 'hidden',
                    icon: 'pi pi-info-circle text-green-500',
                  });
                }
              }}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
                if (haveChanges) setHaveChanges(false);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            disabled={!Edit && !Delete}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
        <Button
          label={t('sts.btn.mc.label.destination')}
          size="small"
          disabled={!isEdit || userInfo.IsCorp || !Edit}
          onClick={() =>
            addHistoryLink({
              title: t('sts.btn.mc.label.destination'),
              path: `${window.origin}/${ROUTER_PATH.mcLabelDestination}/${userInfo.ID}`,
              single: true,
              singleID: `${window.origin}/${ROUTER_PATH.mcLabelDestination}`,
              parentID: window.name,
            })
          }
        />
      </div>
    </div>
  );
};

export default InfoBlock;
