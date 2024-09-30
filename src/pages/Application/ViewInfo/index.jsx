import { useTranslation } from 'react-i18next';

import RenderColumns from 'components/RenderColumns';
import useActions from 'hooks/useActions';
import useShouldDisableButton from 'hooks/useShouldDisableButton';
import ScreenId from 'const/screen.id';
import ROUTER_PATH from 'const/router.path';
import useShowNotAvailable from 'hooks/useShowNotAvailable';

const ViewInfo = () => {
  const { t } = useTranslation();
  const { addHistoryLink } = useActions();
  const { shouldDisable } = useShouldDisableButton();
  const { showNotAvailable } = useShowNotAvailable();

  const COLUMNS = [
    [
      {
        title: t('sts.view.label.view.info'),
        items: [
          {
            title: t(ScreenId.viewLoadInformation),
            disabled: shouldDisable(ScreenId.viewLoadInformation),
            callback: () =>
              addHistoryLink({
                title: t('sts.view.btn.view.load.information'),
                path: `${window.origin}/${ROUTER_PATH.viewLoadInformation}`,
                multiple: true,
              }),
          },
          {
            title: t(ScreenId.piecemarkFind),
            disabled: shouldDisable(ScreenId.piecemarkFind),
            callback: () => showNotAvailable(),
          },
        ],
      },
      {
        title: t('sts.view.btn.view.historical.info'),
        items: [
          {
            title: t(ScreenId.historicalInfo),
            disabled: shouldDisable(ScreenId.historicalInfo),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
  ];

  return (
    <div id="view-info" className="page fadein">
      <RenderColumns data={COLUMNS} />
    </div>
  );
};

export default ViewInfo;
