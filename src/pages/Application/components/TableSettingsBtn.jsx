import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { RadioButton } from 'primereact/radiobutton';

import ROUTER_PATH from 'const/router.path';
import useActions from 'hooks/useActions';
import useWindowControl from 'hooks/useWindowControl';

const TableSettingsBtn = ({
  tableCurrentEntries,
  label = 'sts.btn.table.settings',
  tableID,
  openFromRoutePath,
  save,
  disable,
}) => {
  const { blockedAll } = useWindowControl(window.name, false);
  const { t } = useTranslation();
  const { addHistoryLink, removeHistoryLink } = useActions();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState('SAVE');

  const update = async () => {
    if (selected === 'SAVE') {
      await save(tableID);
      confirmDialog({
        closable: false,
        message: t('sts.txt.modify.table.settings.saved'),
        header: t('sts.txt.modify.table.settings.saved'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }

    if (selected === 'MODIFY') modify();
    close();
  };

  const close = () => {
    setVisible(false);
    setSelected('SAVE');
  };

  const SELECT_OPTIONS = [
    { label: t('sts.btn.save'), value: 'SAVE' },
    { label: t('sts.btn.modify'), value: 'MODIFY' },
  ];

  const modify = () => {
    addHistoryLink({
      title: t('sts.txt.this.is.the.column.settings.window'),
      path: `${window.origin}/${ROUTER_PATH.tableSettings}/${tableID}`,
      parentID: `${window.origin}/${openFromRoutePath}`,
      removeHistoryLink,
      windowCustomData: tableCurrentEntries,
    });
  };

  return (
    <>
      <Button
        label={t(label)}
        disabled={blockedAll || disable}
        onClick={() => setVisible(true)}
        size="small"
      />
      <Dialog
        header={t('sts.txt.modify.table.settings')}
        visible={visible}
        onHide={close}
        closable={false}
      >
        <div className="flex">
          <i className="pi pi-question-circle text-blue-400 mr-3" style={{ fontSize: '2rem' }}></i>
          <div className="w-full">
            <p className="m-0 mb-2">{t('sts.txt.save.or.modify.table.preferences')}</p>
            <div className="flex flex-wrap gap-3">
              {SELECT_OPTIONS.map(({ label, value }) => (
                <div key={value} className="flex align-items-center">
                  <RadioButton
                    inputId={value}
                    value={value}
                    onChange={(e) => setSelected(e.value)}
                    checked={selected === value}
                  />
                  <label htmlFor={value} className="ml-2 cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 my-4">
          <Button disabled={!selected} label={t('sts.btn.ok')} size="small" onClick={update} />
          <Button label={t('sts.btn.cancel')} size="small" onClick={close} />
        </div>
      </Dialog>
    </>
  );
};

export default TableSettingsBtn;
