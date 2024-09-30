import { useTranslation } from 'react-i18next';

import RenderColumns from 'components/RenderColumns';
import ROUTER_PATH from 'const/router.path';
import useActions from 'hooks/useActions';
import ScreenId from 'const/screen.id';
import useShouldDisableButton from 'hooks/useShouldDisableButton';
import useShowNotAvailable from 'hooks/useShowNotAvailable';

const Dashboard = () => {
  const { t } = useTranslation();
  const { addHistoryLink } = useActions();
  const { shouldDisable } = useShouldDisableButton();
  const { showNotAvailable } = useShowNotAvailable();

  const COLUMNS = [
    [
      {
        title: t('sts.import.label.import.data'),
        items: [
          {
            title: t(ScreenId.receiverFormat),
            disabled: shouldDisable(ScreenId.receiverFormat),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.stdFormat),
            disabled: shouldDisable(ScreenId.stdFormat),
            callback: () => showNotAvailable(),
          },
        ],
        children: [
          {
            title: t('sts.import.btn.import.generic.text.files'),
            items: [
              {
                title: t(ScreenId.idWithNums),
                disabled: shouldDisable(ScreenId.idWithNums),
                callback: () => showNotAvailable(),
              },
              {
                title: t(ScreenId.idWithOutNums),
                disabled: shouldDisable(ScreenId.idWithOutNums),
                callback: () => showNotAvailable(),
              },
            ],
          },
        ],
      },
    ],
    [
      {
        title: t('sts.import.label.export.data'),
        items: [
          {
            title: t(ScreenId.receiverFormatExp),
            disabled: shouldDisable(ScreenId.receiverFormatExp),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.stdFormatExp),
            disabled: shouldDisable(ScreenId.stdFormatExp),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.genFormatExp),
            disabled: shouldDisable(ScreenId.genFormatExp),
            callback: () => showNotAvailable(),
          },
        ],
        children: [
          {
            title: t('sts.import.label.custom.export.modules'),
            items: [
              {
                title: t(ScreenId.teklaFileExp),
                disabled: shouldDisable(ScreenId.teklaFileExp),
                callback: () => showNotAvailable(),
              },
              {
                title: t(ScreenId.importSds2),
                disabled: shouldDisable(ScreenId.importSds2),
                callback: () => showNotAvailable(),
              },
            ],
          },
        ],
      },
    ],
    [
      {
        title: t('sts.import.label.custom.import.modules'),
        items: [
          {
            title: t(ScreenId.kissImport),
            disabled: shouldDisable(ScreenId.kissImport),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.kissImport),
                path: `${window.origin}/${ROUTER_PATH.kissImport}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.asnImport),
            disabled: shouldDisable(ScreenId.asnImport),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.perfmonanceContract),
            disabled: shouldDisable(ScreenId.perfmonanceContract),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.pfcExcel),
            disabled: shouldDisable(ScreenId.pfcExcel),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.customerTeklaFileExport),
            disabled: shouldDisable(ScreenId.customerTeklaFileExport),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.stsImport),
            disabled: shouldDisable(ScreenId.stsImport),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.ejeDelimited),
            disabled: shouldDisable(ScreenId.ejeDelimited),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
  ];

  return (
    <div id="import-export" className="page fadein">
      <RenderColumns data={COLUMNS} />
    </div>
  );
};

export default Dashboard;
