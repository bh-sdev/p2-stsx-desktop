import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import isEmail from 'validator/lib/isEmail';

import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';

import { customerById, customerDelete, customerNew, customerUpdate } from 'api';
import { removeEmptyParams } from 'api/general';
import { noNullValues, noSpaceOnStart, validationNumberLength } from 'utils';

import Addresses from '../../components/Addresses';
import Customer from './Customer';
import BarCodeStructure from './BarCodeStructure';
import Accounting from './Accounting';
import { GlobalContext } from 'pages/Application';

import { ContextEditCustomerInformation } from '.';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { FORMS_CONFIG } from 'configs';
import useTabsNavigation from 'hooks/useTabsNavigation';

const CustomerValidationSchema = yup.object({
  CustomerNumber: yup.string().trim().required(),
  CorporationName: yup.string().trim().required(),
  BarcodePrefix: yup
    .string()
    .trim()
    .required()
    .min(FORMS_CONFIG.FORM_BAR_CODE.fieldLength.BarcodePrefix),
  Email: yup
    .string()
    .trim()
    .test({
      name: 'Email',
      test: (value) => (value ? isEmail(value) : true),
    }),
  QuickbooksCoreReferenceNumber: validationNumberLength(
    yup,
    FORMS_CONFIG.FORM_CUSTOMER.fieldLength.QuickbooksCoreReferenceNumber,
  ),
  Staxlocal: validationNumberLength(yup, FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Staxlocal),
  Staxmisc: validationNumberLength(yup, FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Staxmisc),
  Staxmta: validationNumberLength(yup, FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Staxmta),
  Staxstate: validationNumberLength(yup, FORMS_CONFIG.FORM_CUSTOMER.fieldLength.Staxstate),
});

const InfoBlock = ({ current, cancel, created, updated, deleted }) => {
  const { refToast } = useContext(GlobalContext);
  const { setIsEdit, isEdit, isNew, Delete, Edit, Create } = useContext(
    ContextEditCustomerInformation,
  );
  const { t } = useTranslation();
  const [customerInfo, setCustomerInfo] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setIsBusy] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { isValid, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(CustomerValidationSchema),
  });

  const refTabView = useRef();

  useTabsNavigation({ refTabView, set: setActiveIndex, length: 4 });

  useEffect(() => {
    if (current.ID) {
      loadCustomerInfo();
    } else {
      setCustomerInfo(current);
      reset(noNullValues(current));
    }
  }, [current]);

  const loadCustomerInfo = async () => {
    try {
      const res = await customerById(current.ID);
      setCustomerInfo(res);
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
    reset(noNullValues(customerInfo));
  }, [isEdit]);

  useEffect(() => {
    isNew && setActiveIndex(0);
  }, [isNew]);

  const createNew = async (data) => {
    try {
      setIsBusy(true);
      const res = await customerNew(noSpaceOnStart(removeEmptyParams(data)));
      created(res);
      confirmDialog({
        closable: false,
        message: t('sts.txt.customer.created'),
        header: t('sts.txt.customer.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.customer')} ${data.CustomerNumber}`,
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
      setIsBusy(false);
    }
  };

  const update = async (data) => {
    try {
      setIsBusy(true);
      const res = await customerUpdate(current.ID, noSpaceOnStart(removeEmptyParams(data)));
      updated(res);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.customer.updated'),
        header: t('sts.txt.customer.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      if (e.response.data.Message === 'unique constraint failed') {
        confirmDialog({
          closable: false,
          message: t('sts.txt.already.exist', {
            0: `${t('sts.label.customer')} ${data.CustomerNumber}`,
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
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    try {
      await customerDelete(customerInfo.ID);
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

  const deleteCustomer = async () => {
    try {
      await customerDelete(customerInfo.ID, { dry_run: true });
      confirmDialog({
        closable: false,
        message: t('sts.txt.delete.this.customer'),
        header: t('sts.txt.remove.customer'),
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

  return !Object.keys(customerInfo).length ? null : (
    <div className="flex flex-column h-full">
      <div className="flex justify-content-between align-items-center">
        <h3>{`${isNew ? '' : customerInfo.CorporationName}`}</h3>
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
          <TabPanel header={t('sts.tab.customer.customer')} className="h-full">
            <Customer control={control} data={current} setIsEdit={setIsEdit} isEdit={isEdit} />
          </TabPanel>
          <TabPanel header={t('sts.tab.customer.barcodes')} className="h-full" disabled={isNew}>
            <BarCodeStructure
              control={control}
              isEdit={isEdit}
              getValues={getValues}
              watch={watch}
              setValue={setValue}
            />
          </TabPanel>
          <TabPanel header={t('sts.tab.customer.accounting')} className="h-full" disabled={isNew}>
            <Accounting control={control} isEdit={isEdit} />
          </TabPanel>
          <TabPanel header={t('sts.tab.customer.addresses')} className="h-full" disabled={isNew}>
            <Addresses
              Edit={Edit}
              Create={Create}
              Delete={Delete}
              personID={customerInfo.ID}
              isEdit={isEdit}
            />
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
              disabled={!Delete}
              severity="danger"
              size="small"
              onClick={deleteCustomer}
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
            label={t('sts.btn.edit')}
            disabled={!Edit && !Delete}
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
