import { useTranslation } from 'react-i18next';

import RenderColumns from 'components/RenderColumns';
import useShowNotAvailable from 'hooks/useShowNotAvailable';
import useShouldDisableButton from 'hooks/useShouldDisableButton';
import useActions from 'hooks/useActions';
import ScreenId from 'const/screen.id';
import ROUTER_PATH from 'const/router.path';
import { getFoxFire } from 'api';

const Dashboard = () => {
  const { t } = useTranslation();
  const { addHistoryLink } = useActions();
  const { showNotAvailable } = useShowNotAvailable();
  const { shouldDisable } = useShouldDisableButton();

  const COLUMNS = [
    [
      {
        title: t('sts.label.reports'),
        items: [
          {
            title: t(ScreenId.packingListReport),
            disabled: shouldDisable(ScreenId.packingListReport),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.receivingFormat),
            disabled: shouldDisable(ScreenId.receivingFormat),
            callback: () => showNotAvailable(),
          },
        ],
      },
      {
        items: [
          {
            title: t(ScreenId.foxFireRep),
            disabled: shouldDisable(ScreenId.foxFireRep),
            callback: async () => {
              const { AssociationID, TenantID, AccessLevel } = await getFoxFire();
              window.open(
                `${process.env.REACT_APP_FOXFIRE}#/requests?clientId=${AssociationID}&clientParms=${TenantID}&userId=${AccessLevel}`,
                '',
                'left=100px, top=100px, width=1024, height=768',
              );
            },
          },
          {
            title: t(ScreenId.statusReport),
            disabled:
              shouldDisable(ScreenId.columnSelection) && shouldDisable(ScreenId.jobSelection),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.percentComplete),
            disabled: shouldDisable(ScreenId.percentComplete),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.readerSheets),
            disabled: shouldDisable(ScreenId.readerSheets),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.productivityRep),
            disabled: shouldDisable(ScreenId.productivityRep),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
    [
      {
        title: t('sts.label.labels'),
        items: [
          {
            title: t(ScreenId.idLabels),
            disabled: shouldDisable(ScreenId.idLabels),
            callback: () => {
              addHistoryLink({
                title: t(ScreenId.idLabels),
                path: `${window.origin}/${ROUTER_PATH.barcodeIdLabel}`,
                multiple: true,
              });
            },
          },
          {
            title: t(ScreenId.partLabels),
            disabled: shouldDisable(ScreenId.partLabels),
            callback: () => {
              addHistoryLink({
                title: t(ScreenId.barCodeLabels),
                path: `${window.origin}/${ROUTER_PATH.rawMaterialLabels}`,
                multiple: true,
              });
            },
          },
        ],
      },
    ],
  ];

  return (
    <div id="reports-labels" className="page fadein">
      <RenderColumns data={COLUMNS} />
    </div>
  );
};

export default Dashboard;
