import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { ScrollPanel } from 'primereact/scrollpanel';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import {
  preferencesDatPathsGet,
  preferencesDisplayGet,
  preferencesDisplayUpdate,
  preferencesFabSuiteGet,
  preferencesFabSuiteUpdate,
  preferencesHardwareGet,
  preferencesHardwareUpdate,
  preferencesMaterialTypeGet,
  preferencesMaterialTypeUpdate,
  preferencesMiscInfoGet,
  preferencesMiscInfoUpdate,
  preferencesPurchaseOrderGet,
  preferencesPurchaseOrderUpdate,
  preferencesWirelessGet,
  preferencesWirelessUpdate,
} from 'api';
import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import { GlobalContext } from 'pages/Application';
import Display from './Display';
import Wireless from './Wireless';
import PurchaseOrder from './PurchaseOrder';
import PowerFab from './PowerFab';
import DataPaths from './DataPaths';
import MaterialType from './MaterialType';
import MiscInfo from './MiscInfo';
import Hardware from './Hardware';
import { ProgressSpinner } from 'primereact/progressspinner';
import { confirmDialog } from 'primereact/confirmdialog';
import { noEmptyStringValues } from 'utils';
import useTabsNavigation from 'hooks/useTabsNavigation';
import {
  FormDataPath,
  FormDisplay,
  FormHardware,
  FormMaterial,
  FormMiscInfo,
  FormPowerFab,
  FormPurchaseOrder,
  FormWireless,
} from './forms';
import useShouldDisableButton from 'hooks/useShouldDisableButton';

const convertIntoAvailableKey = (string) => string.split('.').join('');

const SCREEN = {
  display: 'sts.tab.display',
  purchaseOrder: 'sts.tab.po.info',
  wireless: 'sts.tab.wireless',
  powerFab: 'sts.tab.power.fab',
  materialType: 'sts.tab.material.type',
  sounds: 'sts.tab.sounds',
  hardware: 'sts.tab.hardware',
  miscInfo: 'sts.tab.misc.info',
  dataPaths: 'sts.tab.data.paths',
};

const ValidationSchema = yup.object({
  [convertIntoAvailableKey(SCREEN.powerFab)]: yup.object({
    FabSuiteDatabase: yup.string().when('FabSuiteInstallation', {
      is: true,
      then: (schema) => schema.required(),
    }),
    FabSuiteServerName: yup.string().when('FabSuiteInstallation', {
      is: true,
      then: (schema) => schema.required(),
    }),
    FabSuitePassword: yup.string().when('FabSuiteInstallation', {
      is: true,
      then: (schema) => schema.required(),
    }),
    FabSuiteUserID: yup.string().when('FabSuiteInstallation', {
      is: true,
      then: (schema) => schema.required(),
    }),
  }),
  [convertIntoAvailableKey(SCREEN.hardware)]: yup.object({
    AutoLoadStartingNumber: yup.number().when('AutoLoadNumberCalc', {
      is: (value) => value !== 'None',
      then: (schema) => schema.required(),
    }),
  }),
  [convertIntoAvailableKey(SCREEN.materialType)]: yup.object({
    RawMaterialSerialNumLen: yup.number().nullable().min(9).max(40),
  }),
  [convertIntoAvailableKey(SCREEN.miscInfo)]: yup.object({
    BarcodeLength: yup.number().nullable().min(10).max(30),
  }),
});

const defaultValues = (data) =>
  data.flat().reduce((ac, { ID, form }) => ({ ...ac, [ID]: form }), {});

const Preferences = () => {
  const { shouldDisable } = useShouldDisableButton();
  const TABS = [
    {
      Name: SCREEN.display,
      ID: convertIntoAvailableKey(SCREEN.display),
      form: FormDisplay,
      disabled: shouldDisable(SCREEN.display),
      request: preferencesDisplayGet,
    },
    {
      Name: SCREEN.purchaseOrder,
      ID: convertIntoAvailableKey(SCREEN.purchaseOrder),
      form: FormPurchaseOrder,
      disabled: shouldDisable(SCREEN.purchaseOrder),
      request: preferencesPurchaseOrderGet,
    },
    {
      Name: SCREEN.wireless,
      ID: convertIntoAvailableKey(SCREEN.wireless),
      form: FormWireless,
      disabled: shouldDisable(SCREEN.wireless),
      request: preferencesWirelessGet,
    },
    {
      Name: SCREEN.powerFab,
      ID: convertIntoAvailableKey(SCREEN.powerFab),
      form: FormPowerFab,
      disabled: shouldDisable(SCREEN.powerFab),
      request: preferencesFabSuiteGet,
    },
    {
      Name: SCREEN.materialType,
      ID: convertIntoAvailableKey(SCREEN.materialType),
      form: FormMaterial,
      disabled: shouldDisable(SCREEN.materialType),
      request: preferencesMaterialTypeGet,
    },
    {
      Name: SCREEN.hardware,
      ID: convertIntoAvailableKey(SCREEN.hardware),
      form: FormHardware,
      disabled: shouldDisable(SCREEN.hardware),
      request: preferencesHardwareGet,
    },
    {
      Name: SCREEN.miscInfo,
      ID: convertIntoAvailableKey(SCREEN.miscInfo),
      form: FormMiscInfo,
      disabled: shouldDisable(SCREEN.miscInfo),
      request: preferencesMiscInfoGet,
    },
    {
      Name: SCREEN.dataPaths,
      ID: convertIntoAvailableKey(SCREEN.dataPaths),
      form: FormDataPath,
      disabled: shouldDisable(SCREEN.dataPaths),
      request: preferencesDatPathsGet,
    },
  ];
  const { refToast } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [isEdit, setIsEdit] = useState(false);
  const [currentTab, setCurrentTab] = useState(null);
  const [screenRefs, setScreenRefs] = useState({});
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { isValid, isDirty, dirtyFields },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(ValidationSchema),
    defaultValues: defaultValues(TABS),
  });

  useTabsNavigation({ set: setCurrentTab, length: TABS.length });

  const refCurrentTabInit = useRef(false);

  useEffect(() => {
    const AVAILABLE_TABS = TABS.filter(({ disabled }) => !disabled);
    if (AVAILABLE_TABS.length && !loading) {
      setLoading(true);
      Promise.allSettled(
        TABS.reduce((a, { ID, request, disabled }, index) => {
          if (!refCurrentTabInit.current && !disabled) {
            setCurrentTab(index);
            refCurrentTabInit.current = true;
          }
          return disabled ? a : [...a, { ID, request }];
        }, []).map(({ ID, request }) => request().then((data) => ({ ID, data }))),
      )
        .then((res) => {
          const RES_DATA_FORM = {};
          res.forEach(({ value }) => {
            if (value) {
              RES_DATA_FORM[value.ID] = value.data;
            }
          });
          reset(RES_DATA_FORM);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [shouldDisable]);

  const getProps = (ID) => ({
    ID: convertIntoAvailableKey(ID),
    control,
    isEdit,
    data: getValues()[convertIntoAvailableKey(ID)],
    setValue,
    getRefs: (refs) => {
      setScreenRefs((prevState) => ({ ...prevState, [ID]: refs }));
    },
    screenRefs: screenRefs[ID],
  });

  const Components = {
    [convertIntoAvailableKey(SCREEN.display)]: {
      Name: SCREEN.display,
      component: <Display {...getProps(SCREEN.display)} />,
      request: preferencesDisplayUpdate,
    },
    [convertIntoAvailableKey(SCREEN.purchaseOrder)]: {
      Name: SCREEN.purchaseOrder,
      component: <PurchaseOrder {...getProps(SCREEN.purchaseOrder)} />,
      request: preferencesPurchaseOrderUpdate,
    },
    [convertIntoAvailableKey(SCREEN.wireless)]: {
      Name: SCREEN.wireless,
      component: <Wireless {...getProps(SCREEN.wireless)} />,
      request: preferencesWirelessUpdate,
    },
    [convertIntoAvailableKey(SCREEN.powerFab)]: {
      Name: SCREEN.powerFab,
      component: <PowerFab {...getProps(SCREEN.powerFab)} />,
      request: preferencesFabSuiteUpdate,
    },
    [convertIntoAvailableKey(SCREEN.dataPaths)]: {
      Name: SCREEN.dataPaths,
      component: <DataPaths {...getProps(SCREEN.dataPaths)} />,
    },
    [convertIntoAvailableKey(SCREEN.materialType)]: {
      Name: SCREEN.materialType,
      component: <MaterialType {...getProps(SCREEN.materialType)} />,
      request: preferencesMaterialTypeUpdate,
    },
    [convertIntoAvailableKey(SCREEN.miscInfo)]: {
      Name: SCREEN.miscInfo,
      component: <MiscInfo {...getProps(SCREEN.miscInfo)} />,
      request: preferencesMiscInfoUpdate,
    },
    [convertIntoAvailableKey(SCREEN.hardware)]: {
      Name: SCREEN.hardware,
      component: <Hardware {...getProps(SCREEN.hardware)} />,
      request: preferencesHardwareUpdate,
    },
  };

  const save = (data) => {
    Object.keys(dirtyFields).forEach(async (key) => {
      if (!Components[key]?.request) return;
      try {
        await Components[key].request(noEmptyStringValues(data[key]));
        reset({ ...getValues(), [key]: data[key] });
        confirmDialog({
          closable: false,
          message: t('sts.txt.preferences.updated'),
          header: t('sts.txt.preferences.updated'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-info-circle text-green-500',
        });
      } catch (e) {
        setTimeout(reset(), 500);
        refToast.current?.show({
          severity: 'error',
          summary: t(Components[key].Name),
          detail: e.response?.data.Message,
          life: 10000,
        });
      } finally {
        setIsEdit(false);
      }
    });
  };

  const cancel = () => {
    setIsEdit(false);
    reset();
  };

  return (
    <div className="flex flex-column p-2 h-full">
      <>
        <div className="flex justify-content-between">
          <div className="w-full">
            <div
              className={classNames({
                'flex justify-content-start flex-wrap gap-2 mb-2': true,
              })}
            >
              {TABS.map(({ Name, ID, disabled }, index) => (
                <div
                  key={ID}
                  className={classNames({
                    'transition-all transition-duration-200 py-2 px-3 cursor-pointer': true,
                    'bg-bluegray-100': currentTab !== index,
                    'p-disabled': disabled,
                    'opacity-40': disabled,
                  })}
                  onClick={() => setCurrentTab(index)}
                >
                  <h4 className="m-0">{t(Name)}</h4>
                </div>
              ))}
            </div>
          </div>

          <GoToRootWindow />
        </div>
        <AutoSizer className="flex-auto w-full">
          {() =>
            loading ? (
              <div className="h-full flex justify-content-center align-items-center">
                <ProgressSpinner
                  style={{ width: '50px', height: '50px' }}
                  pt={{
                    circle: {
                      style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' },
                    },
                  }}
                />
              </div>
            ) : (
              <ScrollPanel
                style={{ width: '100%', height: `100%` }}
                pt={{
                  content: {
                    className: 'p-0',
                  },
                  bary: {
                    className: 'bg-bluegray-300',
                  },
                }}
              >
                <div className="pt-4 h-full">{Components?.[TABS?.[currentTab]?.ID]?.component}</div>
              </ScrollPanel>
            )
          }
        </AutoSizer>
        <div className="flex justify-content-end gap-2 mt-2">
          {isEdit ? null : (
            <Button
              severity="secondary"
              label={t('sts.btn.edit')}
              size="small"
              onClick={() => setIsEdit(true)}
            />
          )}
          {!isEdit ? null : (
            <>
              <Button
                disabled={!isDirty || !isValid}
                label={t('sts.btn.save')}
                size="small"
                onClick={handleSubmit(save)}
              />
              <Button label={t('sts.btn.cancel')} size="small" onClick={cancel} />
            </>
          )}
          <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
        </div>
      </>
    </div>
  );
};

export default Preferences;
