import { useTranslation } from 'react-i18next';

import RenderColumns from 'components/RenderColumns';
import useActions from 'hooks/useActions';
import useShouldDisableButton from 'hooks/useShouldDisableButton';
import useShowNotAvailable from 'hooks/useShowNotAvailable';
import ROUTER_PATH from 'const/router.path';
import ScreenId from 'const/screen.id';
const EditAdd = () => {
  const { t } = useTranslation();

  const { addHistoryLink } = useActions();
  const { shouldDisable } = useShouldDisableButton();

  const { showNotAvailable } = useShowNotAvailable();
  const COLUMNS = [
    [
      {
        title: t('sts.edit.label.edit.add.info'),
        items: [
          {
            title: t(ScreenId.editJobInfo),
            disabled: shouldDisable(ScreenId.editJobInfo),
            callback: () => {
              addHistoryLink({
                title: t(ScreenId.editJobInfo),
                path: `${window.origin}/${ROUTER_PATH.editJobInfo}`,
                multiple: false,
              });
            },
          },
          {
            title: t(ScreenId.piecemarkEntry),
            disabled: shouldDisable(ScreenId.piecemarkEntry),
            callback: () =>
              addHistoryLink({
                title: t('sts.view.btn.piecemark.info'),
                path: `${window.origin}/${ROUTER_PATH.piecemarkEntry}`,
                multiple: false,
              }),
          },
        ],
      },
      {
        title: t('sts.edit.label.transactions'),
        items: [
          {
            title: t(ScreenId.receiveIdnums),
            disabled: shouldDisable(ScreenId.receiveIdnums),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.shipIdNums),
            disabled: shouldDisable(ScreenId.shipIdNums),
            callback: () => {
              addHistoryLink({
                title: t(ScreenId.shipIdNums),
                path: `${window.origin}/${ROUTER_PATH.shipIdNumbers}`,
                multiple: false,
              });
            },
          },
          {
            title: t(ScreenId.moveIdNums),
            disabled: shouldDisable(ScreenId.moveIdNums),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.qcHolds),
            disabled: shouldDisable(ScreenId.qcHolds),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.partInspection),
            disabled: shouldDisable(ScreenId.partInspection),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
    [
      {
        title: t('sts.edit.btn.edit.misc.info'),
        items: [
          {
            title: t(ScreenId.editCustomerInformation),
            disabled: shouldDisable(ScreenId.editCustomerInformation),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.editCustomerInformation),
                path: `${window.origin}/${ROUTER_PATH.editCustomerInformation}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.editCarrierInformation),
            disabled: shouldDisable(ScreenId.editCarrierInformation),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.editCarrierInformation),
                path: `${window.origin}/${ROUTER_PATH.editCarrierInformation}`,
                multiple: true,
              }),
          },
          {
            title: t(ScreenId.employeeInfo),
            disabled: shouldDisable(ScreenId.employeeInfo),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.employeeInfo),
                path: `${window.origin}/${ROUTER_PATH.editEmployeeInformation}`,
                multiple: true,
              }),
          },
          {
            title: t(ScreenId.editEmployeeClassInfo),
            disabled: shouldDisable(ScreenId.editEmployeeClassInfo),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.editEmployeeClassInfo),
                path: `${window.origin}/${ROUTER_PATH.editEmployeeClassInfo}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.editCategoryCodes),
            disabled:
              shouldDisable(ScreenId.CategoryEntry) &&
              shouldDisable(ScreenId.NeedingCodes) &&
              shouldDisable(ScreenId.ExistingPCmarkCodes) &&
              shouldDisable(ScreenId.InternalCodes),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.unitsOfMeasure),
            disabled: shouldDisable(ScreenId.unitsOfMeasure),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.editStatusCodes),
            disabled: shouldDisable(ScreenId.editStatusCodes),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.editStatusCodes),
                path: `${window.origin}/${ROUTER_PATH.editStatusCodes}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.editRoutingCodes),
            disabled: shouldDisable(ScreenId.editRoutingCodes),
            callback: () =>
              addHistoryLink({
                title: t(ScreenId.editRoutingCodes),
                path: `${window.origin}/${ROUTER_PATH.editRoutingCodes}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.materialInfo),
            disabled: shouldDisable(ScreenId.materialInfo),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.editEndConditions),
            disabled: shouldDisable(ScreenId.editEndConditions),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.editWeldNumber),
            disabled: shouldDisable(ScreenId.editWeldNumber),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.enterReaderSheets),
            disabled: shouldDisable(ScreenId.enterReaderSheets),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.actualWeldHours),
            disabled: shouldDisable(ScreenId.actualWeldHours),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
    [
      {
        title: t('sts.edit.label.master.edit'),
        items: [
          {
            title: t(ScreenId.editCostEach),
            disabled: shouldDisable(ScreenId.editCostEach),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.loadPcmk),
            disabled: shouldDisable(ScreenId.loadPcmk),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.enterReaderSheets),
            disabled: shouldDisable(ScreenId.enterReaderSheets),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.sequenceNumber),
            disabled: shouldDisable(ScreenId.sequenceNumber),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.lanSequenceNum),
            disabled: shouldDisable(ScreenId.lanSequenceNum),
            callback: () => showNotAvailable(),
          },
        ],
      },
      {
        title: t('sts.edit.label.data.transfer'),
        items: [
          {
            title: t(ScreenId.moveDataToHistory),
            disabled: shouldDisable(ScreenId.moveDataToHistory),
            callback: () => showNotAvailable(),
          },
          {
            title: t(ScreenId.editDataToArchive),
            disabled: shouldDisable(ScreenId.editDataToArchive),
            callback: () => showNotAvailable(),
          },
        ],
      },
      {
        title: t('sts.edit.label.delete.records'),
        items: [
          {
            title: t(ScreenId.activeRecordDeletes),
            disabled: shouldDisable(ScreenId.activeRecordDeletes),
            callback: () =>
              addHistoryLink({
                title: t('sts.txt.active.record.delete'),
                path: `${window.origin}/${ROUTER_PATH.activeRecordDeletes}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.deletedRecords),
            disabled: shouldDisable(ScreenId.deletedRecords),
            callback: () =>
              addHistoryLink({
                title: t('sts.window.recall.records'),
                path: `${window.origin}/${ROUTER_PATH.deletedRecords}`,
                multiple: false,
              }),
          },
          {
            title: t(ScreenId.purgeDeletedRecords),
            disabled: shouldDisable(ScreenId.purgeDeletedRecords),
            callback: () => showNotAvailable(),
          },
        ],
      },
    ],
  ];

  return (
    <div id="edit-add" className="page fadein">
      <RenderColumns data={COLUMNS} />
    </div>
  );
};

export default EditAdd;
