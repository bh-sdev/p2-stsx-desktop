import { DEFAULT_ROW_HEIGHT } from 'const';
import { useEffect, useRef, useState } from 'react';

const useTableNavigation = ({ data, tableRef, IDField = 'IdfileID', hotKeys = true }) => {
  const [activeColumnIndex, setActiveColumnIndex] = useState(null);
  const [selectedCell, setSelectedCell] = useState({ rowIndex: null, field: null });
  const [firstSelected, setFirstSelected] = useState(null);
  const [lastSelected, setLastSelected] = useState(null);
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState(false);

  const selectedIndex = useRef(0);

  let handleKeyDown = () => {};

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.getTable().addEventListener('focusin', addFocus);
      tableRef.current.getTable().addEventListener('focusout', removeFocus);
    }
    return () => {
      tableRef.current?.getTable().removeEventListener('focusin', addFocus);
      tableRef.current?.getTable().removeEventListener('focusout', removeFocus);
    };
  }, [tableRef.current]);

  const addFocus = () => {
    setFocused(true);
  };

  const removeFocus = () => {
    setFocused(false);
  };

  if (hotKeys) {
    useEffect(() => {
      focused && window.addEventListener('keydown', handleKeyDown);

      return () => {
        focused && window.removeEventListener('keydown', handleKeyDown);
      };
    }, [firstSelected, lastSelected, selected, data, selectedCell, focused]);

    handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const currentRowIndex = selectedCell.rowIndex;
        const currentColumnIndex = data.Cols.findIndex((col) => col.ID === selectedCell.field);

        let newColumnIndex = +currentColumnIndex;
        if (e.key === 'ArrowLeft') {
          newColumnIndex = Math.max(0, currentColumnIndex - 1);
        } else if (e.key === 'ArrowRight') {
          newColumnIndex = Math.min(data.Cols.length - 1, currentColumnIndex + 1);
        }

        const newField = data.Cols[newColumnIndex].ID;
        setActiveColumnIndex(newColumnIndex);
        setSelectedCell({ rowIndex: currentRowIndex, field: String(newField) });
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        if (selected && selected?.length > 0) {
          const currentSelectedIndex = data.Entries.findIndex(
            (item) => item?.[IDField] === lastSelected?.[IDField],
          );
          if (currentSelectedIndex !== -1) {
            const nextIndex =
              e.key === 'ArrowUp'
                ? Math.max(0, currentSelectedIndex - 1)
                : Math.min(data.Entries.length - 1, currentSelectedIndex + 1);
            const nextData = data.Entries[nextIndex];

            if (!e.shiftKey) {
              setSelected([nextData]);
              setLastSelected(nextData);
              handleCellClick(nextData, selectedCell.field);
            } else if (data.Entries && firstSelected && lastSelected) {
              const newRange = selectRange(data.Entries, firstSelected, nextData);
              setSelected(newRange);
              setLastSelected(nextData);
            }
          }
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();

        const currentRowIndex = selectedCell.rowIndex !== null ? selectedCell.rowIndex : 0;

        let newColumnIndex = activeColumnIndex + (e.shiftKey ? -1 : 1);

        if (newColumnIndex >= data.Cols.length) {
          newColumnIndex = 0;
        } else if (newColumnIndex < 0) {
          newColumnIndex = data.Cols.length - 1;
        }

        setActiveColumnIndex(newColumnIndex);
        const newField = data.Cols[newColumnIndex].ID;
        setSelectedCell({ rowIndex: currentRowIndex, field: newField });
      }
    };
  }

  useEffect(() => {
    if (selectedCell.rowIndex != null && selectedCell.field != null) {
      const cellId = `cell-${selectedCell.rowIndex}-${selectedCell.field}`;
      const cellElement = document.getElementById(cellId);

      if (cellElement && tableRef.current) {
        const LEFT_TABLE_PARENT = -tableRef.current?.getTable().offsetParent.getBoundingClientRect()
          .left;
        const VIEW_WIDTH = tableRef.current?.getTable().offsetParent.offsetWidth;
        const LEFT_TABLE = -(
          tableRef.current?.getTable().getBoundingClientRect().left + LEFT_TABLE_PARENT
        );
        if (LEFT_TABLE > cellElement.offsetParent.offsetLeft) {
          tableRef.current.getVirtualScroller().scrollTo({
            left:
              LEFT_TABLE -
              (VIEW_WIDTH -
                (cellElement.offsetParent.clientWidth -
                  (LEFT_TABLE - cellElement.offsetParent.offsetLeft))),
            behavior: 'smooth',
          });
          return;
        }
        if (
          LEFT_TABLE + VIEW_WIDTH - cellElement.offsetParent.clientWidth <
          cellElement.offsetParent.offsetLeft
        ) {
          tableRef.current.getVirtualScroller().scrollTo({
            left:
              LEFT_TABLE +
              VIEW_WIDTH -
              (LEFT_TABLE + VIEW_WIDTH - cellElement.offsetParent.offsetLeft),
            behavior: 'smooth',
          });
        }
      }
    }
  }, [selectedCell, tableRef]);

  const scrollToSelectedIndex = (index = selectedIndex.current) => {
    const LEFT_TABLE_PARENT = -tableRef.current?.getTable().offsetParent.getBoundingClientRect()
      .left;
    const LEFT_TABLE = -(
      tableRef.current?.getTable().getBoundingClientRect().left + LEFT_TABLE_PARENT
    );
    setTimeout(tableRef.current?.getVirtualScroller().scrollInView, 100);
    setTimeout(() => {
      tableRef.current?.getVirtualScroller().scrollTo({
        left: LEFT_TABLE,
        top: index * DEFAULT_ROW_HEIGHT,
        behavior: 'smooth',
      });
    }, 500);
  };

  const selectRange = (data, first, last) => {
    const startIndex = data.findIndex((item) => item?.[IDField] === first?.[IDField]);
    const endIndex = data.findIndex((item) => item?.[IDField] === last?.[IDField]);
    const range = data.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
    return range;
  };

  const handleCellClick = (rowData, columnField) => {
    const rowIndex = data.Entries.indexOf(rowData);
    const columnFieldIndex = data.Cols.findIndex((col) => col.ID === columnField);
    setSelectedCell({ rowIndex, field: columnField });
    setActiveColumnIndex(columnFieldIndex);
    setSelected([rowData]);
    setLastSelected(rowData);
    selectedIndex.current = rowIndex;
  };

  const onRowClick = (e) => {
    if (e.originalEvent.target.tagName === 'svg' || e.originalEvent.target.tagName === 'path') {
      return;
    }
    const newData = e.rowData || e.data;

    const isShiftPressed = e.originalEvent.shiftKey;

    if (!isShiftPressed) {
      setSelected([newData]);
      setFirstSelected(newData);
      setLastSelected(newData);
    } else {
      let newSelected = [];
      const startData = data.Entries.find((item) => item[IDField] === firstSelected[IDField]);
      const startIndex = data.Entries.indexOf(startData);
      const endIndex = data.Entries.indexOf(newData);
      const range = data.Entries.slice(
        Math.min(startIndex, endIndex),
        Math.max(startIndex, endIndex) + 1,
      );
      if (startIndex === endIndex) {
        newSelected = range;
      } else {
        newSelected = [...new Set([...selected, ...range])];
      }

      setSelected(newSelected);
      setLastSelected(newData);
    }
  };
  return {
    onRowClick,
    handleCellClick,
    selected,
    setSelected,
    selectedCell,
    setSelectedCell,
    setFirstSelected,
    setLastSelected,
    handleKeyDown,
    scrollToSelectedIndex,
    activeColumnIndex,
    selectedIndex,
  };
};
export default useTableNavigation;
