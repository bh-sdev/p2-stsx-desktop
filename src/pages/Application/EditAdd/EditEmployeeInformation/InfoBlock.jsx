import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import isEmail from 'validator/lib/isEmail';

import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';

import { employeeById, employeeDelete, employeeNew, employeeUpdate } from 'api';
import { removeEmptyParams } from 'api/general';
import { noNullValues, noSpaceOnStart } from 'utils';
import { ContextEditEmployeeInformation } from '.';

import { GlobalContext } from 'pages/Application';
import Addresses from '../../components/Addresses';
import Employee from './Employee';
import Personal from './Personal';
import LoginAccounts from './LoginAccounts';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import useTabsNavigation from 'hooks/useTabsNavigation';

const EmployeeValidationSchema = yup.object({
  Number: yup.string().trim().required(),
  FirstName: yup.string().trim().required(),
  LastName: yup.string().trim().required(),
  AssociationID: yup.string().trim().required(),
  Email: yup
    .string()
    .trim()
    .test({
      name: 'Email',
      test: (value) => (value ? isEmail(value) : true),
    }),
});

const InfoBlock = ({ current, cancel, created, updated, deleted }) => {
  const { refToast } = useContext(GlobalContext);
  const { setIsEdit, isEdit, isNew, activeActions, Delete, Edit, Create } = useContext(
    ContextEditEmployeeInformation,
  );
  const { t } = useTranslation();
  const [employeeInfo, setEmployeeInfo] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setIsBusy] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    resetField,
    setError,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(EmployeeValidationSchema),
  });

  const refTabView = useRef();

  useTabsNavigation({ refTabView, set: setActiveIndex, length: 4 });

  useEffect(() => {
    if (current.EmployeeID) {
      loadEmployeeInfo();
    } else {
      setEmployeeInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadEmployeeInfo = async () => {
    try {
      const res = await employeeById(current.EmployeeID);
      setEmployeeInfo(res);
      reset(noNullValues(res));
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
    reset(noNullValues(employeeInfo));
  }, [isEdit]);

  useEffect(() => {
    isNew && setActiveIndex(0);
  }, [isNew]);

  const createNew = async (data) => {
    try {
      setIsBusy(true);
      const res = await employeeNew(noSpaceOnStart(removeEmptyParams(data)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee.created'),
        header: t('sts.txt.employee.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.employee')} ${data.Number}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          accept: () => {
            resetField('Number');
            setError('Number', {
              type: 'validate',
              message: '',
            });
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
    try {
      setIsBusy(true);
      const res = await employeeUpdate(current.EmployeeID, noSpaceOnStart(removeEmptyParams(data)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.employee.updated'),
        header: t('sts.txt.employee.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.employee')} ${data.Number}`,
          }),
          header: t('sts.txt.error'),
          acceptLabel: t('sts.btn.ok'),
          accept: () => {
            resetField('Number');
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
    try {
      await employeeDelete(employeeInfo.EmployeeID);
      setIsEdit(false);
      deleted();
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

  const deleteEmployee = async () => {
    try {
      await employeeDelete(employeeInfo.EmployeeID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.this.employee.params', {
          0: employeeInfo.FirstName,
          1: employeeInfo.LastName,
        }),
        header: t('sts.txt.remove.employee'),
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

  return !Object.keys(employeeInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-between align-items-center">
        <h3>
          {isNew
            ? null
            : `${employeeInfo.FirstName || ''} ${employeeInfo.MiddleName || ''} ${
                employeeInfo.LastName || ''
              }`}
        </h3>
        <GoToRootWindow />
      </div>
      <div className="flex-auto">
        <TabView
          ref={refTabView}
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          pt={{
            root: {
              className: 'h-full flex flex-column',
            },
            navcontent: {
              className: 'h-3rem flex align-items-center',
            },
            panelcontainer: {
              className: 'py-2 px-0 h-full',
            },
          }}
        >
          <TabPanel header={t('sts.tab.employee.employee')} className="h-full">
            <Employee control={control} data={current} isEdit={isEdit} />
          </TabPanel>
          <TabPanel header={t('sts.tab.employee.personal')} className="h-full" disabled={isNew}>
            <Personal control={control} isEdit={isEdit} />
          </TabPanel>
          <TabPanel header={t('sts.tab.customer.addresses')} className="h-full" disabled={isNew}>
            <Addresses
              personID={employeeInfo.EmployeeID}
              isEdit={isEdit}
              Edit={Edit}
              Create={Create}
              Delete={Delete}
            />
          </TabPanel>
          <TabPanel header={t('sts.tab.employee.account')} className="h-full" disabled={isNew}>
            <LoginAccounts personID={employeeInfo.EmployeeID} isEdit={isEdit} />
          </TabPanel>
        </TabView>
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
              onClick={deleteEmployee}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
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
            label={t('sts.btn.edit')}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
            disabled={!activeActions || (!Edit && !Delete)}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
