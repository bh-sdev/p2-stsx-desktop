import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Checkbox } from 'primereact/checkbox';

import { noNullValues, noSpaceOnStart, trimStartEnd, truncateString } from 'utils';
import { ContextEditPermission } from '.';

import { GlobalContext } from 'pages/Application';
import {
  deletePermission,
  permissionGetById,
  permissionNew,
  updatePermission,
} from 'api/api.permission';
import { removeEmptyParams } from 'api/general';
import {
  areAllFalse,
  areAllTrue,
  findObjectsWithCreateKey,
  replaceDotsWithDashes,
  setPermissionsFalseAndReturnNew,
  updatePermissions,
} from './object.util';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';

function replaceDashsWithDot(str) {
  return str.replaceAll('-', '.');
}

const PermissionValidationSchema = yup.object({
  Name: yup.string().required(),
});

const InfoBlock = ({ current, cancel, created, updated, deleted, copied }) => {
  const { refToast } = useContext(GlobalContext);
  const { setIsEdit, isEdit, isNew, setEmptyPermissions, Delete, Edit, Create } =
    useContext(ContextEditPermission);
  const { t } = useTranslation();
  const [permission, setPermission] = useState({});
  const [copiedPermission, setCopiedPermission] = useState(null);
  const [copyIndex, setCopyIndex] = useState(1);
  const [busy, setIsBusy] = useState(false);
  const [isDirtyForm, setIsDirtyForm] = useState(false);
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { isValid },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(PermissionValidationSchema),
  });
  useEffect(() => {
    if (permission.ID) {
      setEmptyPermissions(setPermissionsFalseAndReturnNew(permission));
    }
  }, [permission.ID]);

  useEffect(() => {
    if (current.ID) {
      loadPermissionInfo();
    } else {
      setPermission(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadPermissionInfo = async () => {
    try {
      if (copiedPermission) {
        const result = updatePermissions(replaceDotsWithDashes(copiedPermission));
        setPermission(result);
        reset(noNullValues(result));
        return;
      }
      const res = await permissionGetById(current.ID);
      const resultServer = updatePermissions(replaceDotsWithDashes(res));

      setPermission(resultServer);
      reset(noNullValues(resultServer));
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
    reset(noNullValues(permission));
  }, [isEdit]);
  const createNew = async (values) => {
    const objectsWithCreate = findObjectsWithCreateKey(values.Permissions);

    const newResult = {
      Desc: values.Desc,
      Name: values.Name,
      Type: values.Type,
      Permissions: objectsWithCreate,
    };
    try {
      setIsBusy(true);
      const res = await permissionNew(noSpaceOnStart(removeEmptyParams(newResult)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.created.permission.title'),
        header: t('sts.txt.created.permission.title'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.unique.permission'),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          accept: () => {
            if (!copiedPermission) {
              setValue('Name', '');
              setError('Name', {
                type: 'validate',
                message: '',
              });
            } else {
              setIsEdit(false);
              deleted();
            }
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
      setCopiedPermission(null);
      setIsBusy(false);
    }
  };

  const update = async (values) => {
    const objectsWithCreate = findObjectsWithCreateKey(values.Permissions);
    const newResult = {
      Desc: values.Desc,
      Name: values.Name,
      Type: values.Type,
      Permissions: objectsWithCreate,
    };
    try {
      const updatedPerm = await updatePermission(values.ID, newResult);
      updated(updatedPerm);
      confirmDialog({
        closable: false,
        message: t('sts.txt.permission.updated'),
        header: t('sts.txt.permission.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Code === 409) {
        confirmDialog({
          closable: false,
          message: t('sts.text.reversal.changePermissions'),
          acceptClassName: 'p-button-secondary',
          rejectClassName: 'secondary',
          acceptLabel: t('sts.btn.yes'),
          rejectLabel: t('sts.btn.no'),
          icon: 'pi pi-info-circle text-yellow-500',
          accept: async () => {
            const updatedPerm = await updatePermission(values.ID, {
              ...newResult,
              ForceUpdate: true,
            });
            updated(updatedPerm);
            setTimeout(() => {
              confirmDialog({
                closable: false,
                message: t('sts.txt.permission.updated'),
                header: t('sts.txt.permission.updated'),
                acceptLabel: t('sts.btn.ok'),
                rejectClassName: 'hidden',
                icon: 'pi pi-info-circle text-green-500',
              });
            }, 100);
          },
        });
      } else {
        if (e.response.data.Message === 'unique constraint failed') {
          confirmDialog({
            closable: false,
            message: t('sts.txt.unique.permission'),
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
      }
    } finally {
      setIsEdit(false);
    }
  };
  const dupePermission = async () => {
    setCopyIndex((prevState) => prevState + 1);
    const resultObj = {
      ...permission,
      ID: `Copy` + current.ID,
      Name: `${truncateString(permission.Name, 43).replace('.', '')} Copy ${copyIndex}`,
    };
    setCopiedPermission(resultObj);
    copied(resultObj);
    setIsDirtyForm(true);
  };
  const permissionDelete = async () => {
    try {
      await deletePermission(permission.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.permission.params', { 0: permission.Name }),
        header: t('sts.txt.delete.permission.title'),
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
                  await deletePermission(permission.ID);
                  deleted();
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

  const renderRow = (id, permissions, sectionNm, sectionNamePrev, sectionNamePrevPrev) => {
    return (
      <tr>
        <td className={sectionNamePrevPrev ? 'pl-6' : 'pl-4'} style={{ width: 300 }}>
          <p style={{ fontSize: 12, margin: '4px 0px' }}>{t(replaceDashsWithDot(id))}</p>
        </td>
        {['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((permission, index) => {
          const nameField = sectionNamePrevPrev
            ? `Permissions.${sectionNamePrevPrev}.${sectionNamePrev}.${sectionNm}.${id}`
            : sectionNamePrev
            ? `Permissions.${sectionNamePrev}.${sectionNm}.${id}`
            : `Permissions.${sectionNm}.${id}`;

          return (
            <td key={index} className="text-center">
              <Controller
                key={permission}
                name={`${nameField}.${permission}`}
                control={control}
                render={({ field }) => {
                  return (
                    <Checkbox
                      {...field}
                      onChange={(event) => {
                        setIsDirtyForm(true);
                        if (typeof field.value === 'undefined') {
                          return;
                        }
                        if (!event.checked && getValues(permission)) {
                          setValue(permission, false);
                          if (permission === 'View' || permission === 'AllowAll') {
                            ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                              setValue(item, false);
                            });
                          }
                        }
                        if (event.checked) {
                          setValue(permission, false);
                          if (
                            permission === 'Delete' ||
                            permission === 'Edit' ||
                            permission === 'Create'
                          ) {
                            setValue('View', false);
                          }

                          if (permission === 'AllowAll') {
                            ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                              setValue(item, false);
                            });
                          }
                          if (
                            getValues('View') === false &&
                            getValues('Create') === false &&
                            getValues('Edit') === false &&
                            getValues('Delete') === false
                          ) {
                            setValue('AllowAll', false);
                          }
                        }

                        if (field.name === `${nameField}.AllowAll`) {
                          ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                            if (typeof getValues(`${nameField}.${item}`) !== 'undefined') {
                              setValue(`${nameField}.${item}`, event.checked);
                            }
                          });
                        }
                        if (field.name === `${nameField}.View` && !event.checked) {
                          ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                            if (typeof getValues(`${nameField}.${item}`) !== 'undefined') {
                              setValue(`${nameField}.${item}`, false);
                            }
                          });
                        }
                        if (
                          field.name !== `${nameField}.AllowAll` &&
                          getValues(`${nameField}.AllowAll`)
                        ) {
                          setValue(`${nameField}.AllowAll`, false);
                        }

                        if (field.name !== `${nameField}.AllowAll` && event.checked) {
                          const fields = [
                            `${nameField}.View`,
                            `${nameField}.Create`,
                            `${nameField}.Edit`,
                            `${nameField}.Delete`,
                          ].filter((item) => item !== field.name);

                          if (
                            fields.map((fieldName) => getValues(fieldName)).every((item) => item)
                          ) {
                            setValue(`${nameField}.AllowAll`, true);
                          }
                        }

                        if (
                          (field.name !== `${nameField}.Create` ||
                            field.name !== `${nameField}.Delete` ||
                            field.name !== `${nameField}.Update`) &&
                          event.checked
                        ) {
                          setValue(`${nameField}.View`, true);
                        }
                        field.onChange(event.checked);
                        if (!event.checked) {
                          ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                            if (
                              areAllFalse(
                                getValues('Permissions'),
                                item,
                                field.name.replace('Permissions.', ''),
                              )
                            ) {
                              setValue(item, null);
                            }
                          });
                        }
                        if (event.checked) {
                          ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((item) => {
                            if (
                              areAllTrue(
                                getValues('Permissions'),
                                item,
                                field.name.replace('Permissions.', ''),
                              )
                            )
                              setValue(item, true);
                          });
                        }
                      }}
                      disabled={(!isEdit && !isNew) || typeof field.value === 'undefined'}
                      checked={field.value}
                    />
                  );
                }}
              />
            </td>
          );
        })}
      </tr>
    );
  };
  function updateSpecificPermission(obj, permissionKey, newValue) {
    if (obj !== null && typeof obj === 'object') {
      for (const key in obj) {
        if (permissionKey.includes(key)) {
          if (obj[key] !== undefined) {
            obj[key] = newValue;
          }
        } else if (typeof obj[key] === 'object') {
          updateSpecificPermission(obj[key], permissionKey, newValue);
        }
      }
    }
  }
  const renderAllScreenCheckboxes = () => {
    return ['AllowAll', 'View', 'Create', 'Edit', 'Delete'].map((permission, index) => {
      return (
        <td key={index} className="text-center">
          <Controller
            render={({ field }) => {
              return (
                <TriStateCheckbox
                  {...field}
                  onChange={(event) => {
                    setIsDirtyForm(true);
                    let newValue = event.value === false ? null : true;
                    field.onChange(newValue);

                    if (field.name === `AllowAll`) {
                      const data = getValues();
                      updateSpecificPermission(
                        data,
                        ['AllowAll', 'View', 'Create', 'Edit', 'Delete'],
                        newValue,
                      );
                      reset(data);
                    }
                    if (field.name === `View` && !newValue) {
                      const data = getValues();
                      updateSpecificPermission(
                        data,
                        ['AllowAll', 'View', 'Create', 'Edit', 'Delete'],
                        null,
                      );
                      reset(data);
                    }
                    if (field.name !== 'AllowAll' && getValues('AllowAll')) {
                      const data = getValues();
                      updateSpecificPermission(data, ['AllowAll'], null);
                      reset(data);
                    }
                    if (field.name !== `AllowAll` && newValue) {
                      const fields = [`View`, `Create`, `Edit`, `Delete`].filter(
                        (item) => item !== field.name,
                      );

                      if (fields.map((fieldName) => getValues(fieldName)).every((item) => item)) {
                        const data = getValues();
                        updateSpecificPermission(data, ['AllowAll'], true);
                        reset(data);
                      }
                    }
                    if (
                      (field.name !== `Create` ||
                        field.name !== `Delete` ||
                        field.name !== `Update`) &&
                      newValue
                    ) {
                      const data = getValues();
                      updateSpecificPermission(data, ['View'], true);
                      reset(data);
                    }
                    const data = getValues();
                    updateSpecificPermission(data, [permission], newValue);
                    reset(data);
                  }}
                  disabled={!isEdit && !isNew}
                  value={field.value}
                />
              );
            }}
            control={control}
            name={permission}
          />
        </td>
      );
    });
  };

  const renderSection = (permissions, sectionNm, sectionNameSubGroup, sectionNameSubGroupSec) => {
    return (
      <div>
        {Object.entries(permissions).map(([id, perms]) => {
          if (perms.View !== undefined) {
            return (
              <>
                <thead>
                  <tr>
                    <th style={{ width: 300 }}></th>
                    <th width={60} />
                    <th width={60} />
                    <th width={60} />
                    <th width={60} />
                    <th width={60} />
                  </tr>
                </thead>
                {renderRow(id, perms, sectionNm, sectionNameSubGroup, sectionNameSubGroupSec)}
              </>
            );
          } else {
            return (
              <tr key={id}>
                <td colSpan={7}>
                  <h4
                    style={{ fontFamily: 'inherit', marginTop: 7, marginBottom: 7 }}
                    className={
                      id === 'sts-edit-btn-edit-category-codes' ||
                      id === 'sts-btn-reports-status-report'
                        ? 'ml-6'
                        : 'ml-4'
                    }
                  >
                    {t(replaceDashsWithDot(id))}
                  </h4>
                  {renderSection(perms, id, sectionNm, sectionNameSubGroup)}
                </td>
              </tr>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-column h-full pb-2">
      <div className="flex my-4">
        <div className="my-1">
          <div className="flex align-items-center">
            <div className="mr-4 w-7">{t('sts.label.group.name')}:</div>
            <Controller
              name="Name"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  disabled={!isEdit && !isNew}
                  id={field.name}
                  {...field}
                  onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                  onChange={(event) => {
                    setIsDirtyForm(true);
                    const newValue = event.target.value;

                    if (field.value.startsWith('.') && newValue.startsWith('.') === false) {
                      return;
                    }

                    if (
                      (newValue[0] === '.' || newValue[0] === ' ') &&
                      field.value[0] !== newValue[0]
                    ) {
                      return;
                    }

                    field.onChange(newValue);
                  }}
                  className={classNames({
                    'p-invalid': fieldState.invalid,
                    required: true,
                  })}
                  maxLength={50}
                />
              )}
            />
          </div>
        </div>
        <div className="ml-2 my-1">
          <div className="flex align-items-center">
            <div className="mr-4">{t('sts.reports.description')}:</div>
            <Controller
              name="Desc"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  disabled={!isEdit && !isNew}
                  style={{ width: 400 }}
                  id={field.name}
                  {...field}
                  onBlur={(e) => field.onChange(trimStartEnd(e.target.value))}
                  onChange={(event) => {
                    setIsDirtyForm(true);
                    field.onChange(event.target.value);
                  }}
                  className={classNames({
                    'p-invalid': fieldState.invalid,
                  })}
                  maxLength={50}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div>
        <thead>
          <tr>
            <th style={{ width: 300 }}></th>
            <th width={60}>{t('sts.table.permissions.allowAll')}</th>
            <th width={60}>{t('sts.table.permissions.read')}</th>
            <th width={60}>{t('sts.table.permissions.create')}</th>
            <th width={60}>{t('sts.table.permissions.edit')}</th>
            <th width={60}>{t('sts.table.permissions.delete')}</th>
          </tr>
          <tr>
            <td style={{ width: 300 }}>
              <h4 style={{ fontFamily: 'inherit' }}>{t('sts.label.allScreens')}</h4>
            </td>
            {renderAllScreenCheckboxes()}
          </tr>
        </thead>
      </div>
      {permission?.Permissions && (
        <div style={{ height: '90%', overflow: 'auto', marginBottom: 10 }}>
          {Object.entries(permission?.Permissions).map(([sectionName, sectionPerms]) => {
            return (
              <div key={sectionName}>
                <h4
                  style={{ fontFamily: 'inherit', marginTop: 7, marginBottom: 7 }}
                  className="ml-2"
                >
                  {t(replaceDashsWithDot(sectionName))}
                </h4>
                {renderSection(sectionPerms, sectionName)}
              </div>
            );
          })}
        </div>
      )}

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
            <Button
              label={t('sts.btn.cancel')}
              disabled={busy}
              size="small"
              onClick={() => {
                setIsDirtyForm(false);
                cancel();
              }}
            />
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.dupe')}
              size="small"
              disabled={copiedPermission || !Create}
              loading={busy}
              onClick={dupePermission}
            />
            <Button
              label={t('sts.btn.delete')}
              disabled={Boolean(copiedPermission) || !Delete}
              severity="danger"
              size="small"
              onClick={permissionDelete}
            />
            <Button
              disabled={!isValid || !isDirtyForm || (copiedPermission && Create ? false : !Edit)}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(copiedPermission ? createNew : update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                if (copiedPermission) {
                  setCopiedPermission(null);
                  setCopyIndex((prevState) => prevState - 1);
                  deleted();
                }
                setIsDirtyForm(false);
                setIsEdit(false);
              }}
            />
          </>
        ) : (
          <Button
            label={t('sts.btn.edit')}
            disabled={!Create && !Edit && !Delete}
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
