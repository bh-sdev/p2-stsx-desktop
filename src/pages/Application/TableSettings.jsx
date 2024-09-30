import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Button } from 'primereact/button';

import useWindowControl from 'hooks/useWindowControl';
import useTableSettings from 'hooks/useTableSettings';
import { useParams } from 'react-router-dom';
import { PickList } from 'primereact/picklist';
import { InputNumber } from 'primereact/inputnumber';
import { confirmDialog } from 'primereact/confirmdialog';

const TableSettings = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tableSettings, tableSettingsGet, tableSettingsSave } = useTableSettings({});
  const { sendPost, blockedAll } = useWindowControl(window.opener?.name);

  const [selectedTarget, setSelectedTarget] = useState([]);
  const [target, setTarget] = useState([]);
  const [source, setSource] = useState([]);

  const [orderIndex, setOrderIndex] = useState(null);
  const [applied, setApplied] = useState(false);

  const refPicker = useRef(null);

  const getFirstSelected = selectedTarget?.[0] || null;
  const getSelectedIndex = () => (!getFirstSelected ? null : target.indexOf(getFirstSelected));

  useEffect(() => {
    sendPost({ status: true });
    tableSettingsGet(id);
    return () => {
      blockedAll && sendPost({ status: false });
    };
  }, []);

  const Entries =
    JSON.parse(localStorage.getItem('windowCustomData') || 'null') || tableSettings.Entries || [];

  useEffect(() => {
    if (tableSettings.Descs) {
      init(Entries);
    }
  }, [tableSettings]);

  const init = (current) => {
    setTarget(current.map(({ ID }) => tableSettings.Descs.find((desc) => desc.ID === ID)) || []);
    setSource(
      tableSettings.Descs.filter(({ ID }) => !current.find((entr) => entr.ID === ID)) || [],
    );
  };

  const pickerSourceItem = (value) => {
    const trigger = (e) => {
      e.preventDefault();
      refPicker.current.props.onChange({
        target: [...target, value],
        source: source.filter(({ ID }) => ID !== value.ID),
      });
    };
    return (
      <div style={{ userSelect: 'none' }} onContextMenu={trigger} onDoubleClick={trigger}>
        {value.Prefix && `(${value.Prefix})`} {value.Name}
      </div>
    );
  };

  const pickerTargetItem = (value) => {
    const trigger = (e) => {
      e.preventDefault();
      refPicker.current.props.onChange({
        target: target.filter(({ ID }) => ID !== value.ID),
        source: [...source, value],
      });
    };
    return (
      <div style={{ userSelect: 'none' }} onContextMenu={trigger} onDoubleClick={trigger}>
        {value.Prefix && `(${value.Prefix})`} {value.Name}
      </div>
    );
  };

  const getPreparedData = () => {
    const requestData = [];
    target.forEach(({ ID }) => {
      const exist = Entries.find((entr) => entr.ID === ID);
      requestData.push(exist || { ID, Size: 0 });
    });
    return requestData;
  };

  const save = async () => {
    localStorage.removeItem('windowCustomData');
    const res = await tableSettingsSave(id, getPreparedData());
    sendPost({
      customData: {
        tableSettings: {
          [id]: {
            type: 'save',
            data: res.Entries,
          },
        },
      },
    });
    setApplied(false);
    confirmDialog({
      closable: false,
      message: t('sts.txt.modify.table.settings.saved'),
      header: t('sts.txt.modify.table.settings.saved'),
      acceptLabel: t('sts.btn.ok'),
      rejectClassName: 'hidden',
      icon: 'pi pi-info-circle text-green-500',
    });
  };

  const apply = () => {
    setApplied(true);
    sendPost({
      customData: {
        tableSettings: {
          [id]: {
            type: 'apply',
            data: getPreparedData(),
            params: { ColIDs: getPreparedData().map(({ ID }) => ID) },
          },
        },
      },
    });
  };

  const setOrder = (e) => {
    e.preventDefault();
    if (getSelectedIndex() === null || orderIndex === null || orderIndex - 1 === getSelectedIndex())
      return;

    target.splice(orderIndex - 1, 0, target.splice(getSelectedIndex(), 1)[0]);
    setTarget(target);
    setOrderIndex(null);
  };

  return (
    <div className="flex flex-column table h-full p-2">
      <AutoSizer className="flex-auto w-full">
        {({ height }) => (
          <PickList
            className="h-full"
            ref={refPicker}
            dataKey="ID"
            showSourceControls={false}
            source={source}
            target={target}
            breakpoint="1024"
            onChange={(e) => {
              if (e.target) {
                setTarget(e.target);
              }
              if (e.source) {
                setSource(e.source);
              }
              if (getFirstSelected && !e.target.find(({ ID }) => ID === getFirstSelected.ID)) {
                setSelectedTarget([]);
              }
            }}
            targetSelection={selectedTarget}
            onTargetSelectionChange={({ value }) => {
              setSelectedTarget(value);
            }}
            onSourceSelectionChange={() => {
              setSelectedTarget([]);
            }}
            sourceItemTemplate={pickerSourceItem}
            targetItemTemplate={pickerTargetItem}
            sourceHeader={`${t('sts.txt.available.columns')} ${source.length}`}
            targetHeader={() => (
              <div className="flex align-items-center justify-content-between w-full">
                {t('sts.txt.show.these.columns')} {target.length}
                <div className="flex">
                  <div className="p-inputgroup flex-1">
                    <Button
                      disabled={!getFirstSelected}
                      label={t('sts.btn.set')}
                      onClick={setOrder}
                    />
                    <InputNumber
                      className="w-4rem"
                      placeholder="0"
                      value={orderIndex}
                      onKeyDown={(e) => e.key === 'Enter' && setOrder(e)}
                      onChange={(e) => {
                        if (e.value < 1) {
                          setOrderIndex(1);
                          return;
                        }
                        if (e.value > target.length) {
                          setOrderIndex(target.length);
                          return;
                        }
                        setOrderIndex(e.value);
                      }}
                      min={1}
                      max={target.length}
                      useGrouping={false}
                    />
                  </div>
                </div>
              </div>
            )}
            sourceStyle={{ maxHeight: height - 104, height: height - 104 }}
            targetStyle={{ maxHeight: height - 104, height: height - 104 }}
            pt={{
              header: {
                style: {
                  height: 58,
                  display: 'flex',
                  alignItems: 'center',
                },
              },
            }}
          />
        )}
      </AutoSizer>
      <div className="flex justify-content-end gap-2 mt-3">
        <Button disabled={!applied} label={t('sts.btn.save')} size="small" onClick={save} />
        <Button label={t('sts.btn.apply')} size="small" onClick={apply} />
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default TableSettings;
