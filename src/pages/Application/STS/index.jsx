import { useTranslation } from 'react-i18next';

import useActions from 'hooks/useActions';
import RenderColumns from 'components/RenderColumns';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
import useShouldDisableButton from 'hooks/useShouldDisableButton';
import useShowNotAvailable from '../../../hooks/useShowNotAvailable';

const STS = () => {
  const { t } = useTranslation();
  const { addHistoryLink } = useActions();
  const { shouldDisable } = useShouldDisableButton();
  const { showNotAvailable } = useShowNotAvailable();

  const COLUMNS = [
    [
      {
        items: [
          {
            title: t(ScreenId.defaultHelp),
            disabled: shouldDisable(ScreenId.defaultHelp),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.whoIAm),
            disabled: shouldDisable(ScreenId.whoIAm),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.preferences),
            disabled:
              shouldDisable(ScreenId.dataPath) &&
              shouldDisable(ScreenId.Hardware) &&
              shouldDisable(ScreenId.Display) &&
              shouldDisable(ScreenId.POInfo) &&
              shouldDisable(ScreenId.miscInfo) &&
              shouldDisable(ScreenId.Sounds) &&
              shouldDisable(ScreenId.Wireless) &&
              shouldDisable(ScreenId.Wireless) &&
              shouldDisable(ScreenId.MaterialType) &&
              shouldDisable(ScreenId.PowerFab) &&
              shouldDisable(ScreenId.SDS2),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.preferences),
                path: `${window.origin}/${ROUTER_PATH.preferences}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.barCodePrinterPrefs),
            disabled: shouldDisable(ScreenId.barCodePrinterPrefs),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.barCodePrinterPrefs),
                path: `${window.origin}/${ROUTER_PATH.barCodePrinterPrefs}`,
                multiple: false,
                rectangleView: true,
              }),
          },
          {
            title: t(ScreenId.divisionManagement),
            disabled: shouldDisable(ScreenId.divisionManagement),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.divisionManagement),
                path: `${window.origin}/${ROUTER_PATH.divisionManagement}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.logonAccessManagement),
            disabled: shouldDisable(ScreenId.logonAccessManagement),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.logonAccessManagement),
                path: `${window.origin}/${ROUTER_PATH.logonAccessManagement}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.applicationPermission),
            disabled: shouldDisable(ScreenId.applicationPermission),
            callback: () =>
              addHistoryLink({
                title: t('sts.window.STS.permissions'),
                path: `${window.origin}/${ROUTER_PATH.applicationPermissions}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.viewLog),
            disabled: shouldDisable(ScreenId.viewLog),
            callback: () =>
              addHistoryLink({
                title: t('sts.window.rf.transaction.log'),
                path: `${window.origin}/${ROUTER_PATH.viewLog}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.licenseInfo),
            disabled: shouldDisable(ScreenId.licenseInfo),
            callback: () =>
              addHistoryLink({
                title: t('sts.default.btn.view.logon.license.info'),
                path: `${window.origin}/${ROUTER_PATH.viewLogonLicensesInfo}`,
                multiple: false,
              }),
          },
        ],
      },
    ],
    [
      {
        items: [
          {
            title: t(ScreenId.i18n),
            disabled: shouldDisable(ScreenId.i18n),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.reindexTables),
            disabled: shouldDisable(ScreenId.reindexTables),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.resorePrefs),
            disabled: shouldDisable(ScreenId.resorePrefs),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.fieldsLabel),
            disabled: shouldDisable(ScreenId.fieldsLabel),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.backupDatabase),
            disabled: shouldDisable(ScreenId.backupDatabase),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
  ];

  return (
    <div id="settings" className="page fadein">
      <RenderColumns data={COLUMNS} />
    </div>
  );
};

export default STS;
