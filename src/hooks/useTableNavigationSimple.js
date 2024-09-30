import { useCallback, useEffect, useRef, useState } from 'react';

const useTableNavigationSimple = ({
  data,
  setSelected,
  tableRef,
  initialRow = 0,
  initialColumn = 0,
}) => {
  const [selectedCell, setSelectedCell] = useState({ rowIndex: initialRow, field: initialColumn });
  const [activeColumnIndex, setActiveColumnIndex] = useState(initialColumn);
  const selectedIndex = useRef(initialRow);

  const scrollToSelectedIndex = useCallback(
    (index) => {
      const LEFT_TABLE_PARENT = -tableRef.current?.getTable().offsetParent.getBoundingClientRect()
        .left;
      const LEFT_TABLE = -(
        tableRef.current?.getTable().getBoundingClientRect().left + LEFT_TABLE_PARENT
      );
      setTimeout(tableRef.current?.getVirtualScroller().scrollInView, 100);
      setTimeout(() => {
        tableRef.current?.getVirtualScroller().scrollTo({
          left: LEFT_TABLE,
          top: index * 30,
          behavior: 'smooth',
        });
      }, 500);
    },
    [tableRef],
  );

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

  const handleCellClick = useCallback(
    (rowData, columnField) => {
      const rowIndex = data.Entries.indexOf(rowData);
      const columnFieldIndex = data.Cols.findIndex((col) => col.Alias === columnField);
      setSelectedCell({ rowIndex, field: columnField });
      setActiveColumnIndex(columnFieldIndex);
      setSelected(rowData);
      selectedIndex.current = rowIndex;
    },
    [data, setSelected, scrollToSelectedIndex],
  );

  const handleKeyDown = useCallback(
    (e) => {
      const entries = data.Entries || [];
      let newIndex = selectedIndex.current;
      let newColumnIndex = data.Cols.findIndex((col) => col.Alias === selectedCell.field);
      let rowIndex = selectedIndex.current;
      let columnIndex = activeColumnIndex;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (entries.length > 0 && newColumnIndex !== -1) {
          if (e.key === 'ArrowUp') {
            newIndex = Math.max(0, newIndex - 1);
          } else if (e.key === 'ArrowDown') {
            newIndex = Math.min(entries.length - 1, newIndex + 1);
          }

          const newSelected = entries[newIndex];
          const newField = data.Cols[newColumnIndex].Alias;
          setSelected(newSelected);
          setSelectedCell({ rowIndex: newIndex, field: newField });
          selectedIndex.current = newIndex;
          scrollToSelectedIndex(newIndex);
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        columnIndex = e.key === 'ArrowLeft' ? columnIndex - 1 : columnIndex + 1;
        if (columnIndex >= data.Cols.length) {
          columnIndex = 0;
        } else if (columnIndex < 0) {
          columnIndex = data.Cols.length - 1;
        }

        setActiveColumnIndex(columnIndex);
        const newField = data.Cols[columnIndex].Alias;
        setSelectedCell({ rowIndex, field: newField });
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
        const newField = data.Cols[newColumnIndex].Alias;
        setSelectedCell({ rowIndex: currentRowIndex, field: newField });
      }
    },
    [data, selectedCell, setSelected, scrollToSelectedIndex],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedCell,
    setSelectedCell,
    activeColumnIndex,
    handleCellClick,
    handleKeyDown,
    scrollToSelectedIndex,
  };
};
export default useTableNavigationSimple;
