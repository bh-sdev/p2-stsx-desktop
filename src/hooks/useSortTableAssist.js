import { useEffect, useRef, useState } from 'react';

const useSortTableAssist = ({ tableRef }) => {
  const [sortMeta, setSortMeta] = useState(null);
  const [sortParams, setSortParams] = useState([]);
  const isCtrl = useRef(false);
  const selectedSortedFields = useRef({});

  useEffect(() => {
    const checkKeyDown = (e) => {
      if (!isCtrl.current && e.key === 'Control') {
        isCtrl.current = true;
      }
    };
    const checkKeyUp = (e) => {
      if (e.key === 'Control') {
        isCtrl.current = false;
      }
    };
    window.addEventListener('keydown', checkKeyDown);
    window.addEventListener('keyup', checkKeyUp);
    return () => {
      window.removeEventListener('keydown', checkKeyDown);
      window.removeEventListener('keyup', checkKeyUp);
    };
  }, []);

  const sortTableParams = (e, scroll = true) => {
    if (scroll) {
      const LEFT_TABLE_PARENT = -tableRef.current?.getTable().offsetParent.getBoundingClientRect()
        .left;
      const LEFT_TABLE = -(
        tableRef.current?.getTable().getBoundingClientRect().left + LEFT_TABLE_PARENT
      );
      setTimeout(tableRef.current?.getVirtualScroller().scrollInView, 100);
      setTimeout(() => {
        tableRef.current?.getVirtualScroller().scrollTo({
          left: LEFT_TABLE,
          top: 0,
          behavior: 'smooth',
        });
      }, 500);
    }

    const META = selectedSortedFields.current?.[e.sortField];

    const LAST = Object.values(selectedSortedFields.current)[
      Object.keys(selectedSortedFields.current).length - 1
    ];

    const SortData = {
      order: !isCtrl.current
        ? 1
        : selectedSortedFields.current?.[e.sortField]?.order || (LAST?.order || 0) + 1,
      sortOrder: !META?.sortField ? 1 : META.sortOrder === 1 ? -1 : null,
      sortField: !META?.sortField ? e.sortField || null : META?.sortOrder < 0 ? null : e.sortField,
    };

    setSortMeta(SortData);

    if (!SortData.sortField) {
      if (selectedSortedFields.current?.[META?.sortField]?.order < LAST.order) {
        Object.keys(selectedSortedFields.current).forEach((key) => {
          if (
            selectedSortedFields.current[key]?.order >
            selectedSortedFields.current?.[META?.sortField]?.order
          ) {
            selectedSortedFields.current[key].order -= 1;
          }
        });
      }
      delete selectedSortedFields.current?.[META?.sortField || LAST.sortField];
    } else {
      if (isCtrl.current) {
        selectedSortedFields.current[SortData.sortField] = SortData;
      } else {
        selectedSortedFields.current = { [SortData.sortField]: SortData };
      }
    }

    const RES = Object.values(selectedSortedFields.current).map(({ sortField, sortOrder }) => ({
      ID: sortField,
      Desc: sortOrder < 0,
    }));

    setSortParams(RES);

    return RES;
  };

  const iconStatus = ({ props: { column } }) =>
    !selectedSortedFields.current[column?.props.field] ? (
      <i className="pi pi-sort-alt ml-2" style={{ color: 'var(--text-color-secondary)' }}></i>
    ) : (
      <div className="flex align-items-center justify-content-center">
        <span
          className="flex align-items-center justify-content-center"
          style={{
            color: 'var(--primaryLight-50)',
            background: 'var(--primaryDark-500)',
            borderRadius: 2,
            width: 20,
            height: 14,
          }}
        >
          {selectedSortedFields.current[column?.props.field].order}
        </span>
        <i
          className={`pi pi-sort-amount-${
            selectedSortedFields.current[column?.props.field].sortOrder < 0 ? 'down' : 'up'
          }-alt ml-2`}
        ></i>
      </div>
    );

  const clearSort = () => {
    selectedSortedFields.current = {};
    setSortMeta(null);
  };

  return {
    sortMeta,
    sortParams,
    sortTableParams,
    iconStatus,
    clearSort,
  };
};

export default useSortTableAssist;
