import { useEffect, useState } from 'react';

import { tablePreferencesGet, tablePreferencesUpdate } from 'api';
import useWindowControl from './useWindowControl';
import { DEFAULT_LIMIT_LOAD_PARAMS } from 'const';

const useTableSettings = ({
  initTable,
  tableRef,
  notOrderFirst = false,
  params = DEFAULT_LIMIT_LOAD_PARAMS,
  initRequest = true,
  paginated = false,
}) => {
  const { receivedData } = useWindowControl(window.name, false);
  const [ID, setID] = useState(null);
  const [tableSettings, setTableSettings] = useState({});
  const [emptyCols, setEmptyCols] = useState(false);
  const [tableSettingsParams, setTableSettingsParams] = useState({});

  useEffect(() => {
    if (initRequest) {
      initTable?.();
    }
  }, []);

  useEffect(() => {
    if (receivedData?.tableSettings && receivedData.tableSettings[ID]) {
      if (receivedData.tableSettings[ID].type === 'save') {
        initTable?.();
      } else {
        tableRef.current.resetResizeColumnsWidth();
        if (receivedData.tableSettings[ID].data?.length) {
          setEmptyCols(false);
          if (!paginated) {
            tableRef?.current?.restoreTableState({
              columnOrder: notOrderFirst
                ? ['not_ordered', ...receivedData.tableSettings[ID].params.ColIDs]
                : receivedData.tableSettings[ID].params.ColIDs,
            });
          }
          initTable?.({ ...receivedData.tableSettings[ID].params, ...params });
          setTableSettingsParams(receivedData.tableSettings[ID].params);
        } else {
          setEmptyCols(true);
        }
        setTableEntries(receivedData.tableSettings[ID].data);
      }
    }
  }, [receivedData]);

  const setTableEntries = (Entries) => {
    setTableSettings((prevState) => {
      return { ...prevState, Entries };
    });
  };

  const setSizeByColID = (e) => {
    const ID = e.column.props.columnKey;
    const Size = Math.round(e.element.getBoundingClientRect().width);
    setTableSettings((prevState) => {
      const updated = {
        ...prevState,
        Entries: prevState.Entries.map((col) => (col.ID === ID ? { ID, Size } : col)),
      };
      return updated;
    });
  };

  const setOrderByColID = (e) => {
    const { dragIndex, dropIndex } = e;
    const DRAG_INDEX = dragIndex - (notOrderFirst ? 1 : 0);
    const DROP_INDEX = dropIndex - (notOrderFirst ? 1 : 0);
    setTableSettings((prevState) => {
      const UPDATED = [...prevState.Entries];
      const remove = UPDATED.splice(DRAG_INDEX, 1);
      UPDATED.splice(DROP_INDEX, 0, remove[0]);
      return { ...prevState, Entries: UPDATED };
    });
  };

  const tableSettingsGet = (tableID) => {
    if (!ID) setID(tableID);
    return tablePreferencesGet(tableID).then((res) => {
      setTableSettings(res);
      setEmptyCols(!res.Entries.length);
    });
  };

  const tableSettingsSave = async (tableID, data) =>
    tablePreferencesUpdate(tableID, {
      Entries: data || tableSettings.Entries,
    }).then((res) => {
      setTableSettings(res);
      return res;
    });

  return {
    emptyCols,
    tableSettings,
    setTableEntries,
    setSizeByColID,
    setOrderByColID,
    tableSettingsGet,
    tableSettingsSave,
    tableSettingsParams,
    setTableSettingsParams,
  };
};

export default useTableSettings;
