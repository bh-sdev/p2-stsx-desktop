import { useRef, useState } from 'react';

const useSelectByCheckbox = (data, keyID = 'IdfileID') => {
  const [checkBoxSelected, setCheckBoxSelected] = useState({});

  const refLastActiveCheckBoxSelectIndex = useRef(0);
  const refLastInActiveCheckBoxSelectIndex = useRef(0);

  const checkBoxSelect = (e, rowData, index, cb) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.checked) {
      if (e.originalEvent.shiftKey) {
        setCheckBoxSelected((prevState) => {
          const lastIndex = !Object.values(prevState).length
            ? 0
            : refLastActiveCheckBoxSelectIndex.current;
          const currentIndex = index;
          if (lastIndex < currentIndex) {
            for (let i = lastIndex; i <= currentIndex; i++) {
              if (!prevState[data[i][keyID]]) prevState[data[i][keyID]] = data[i];
            }
          } else {
            for (let i = currentIndex; i <= lastIndex; i++) {
              if (!prevState[data[i][keyID]]) prevState[data[i][keyID]] = data[i];
            }
          }
          cb?.(prevState);
          return { ...prevState };
        });
      } else {
        refLastActiveCheckBoxSelectIndex.current = index;
        setCheckBoxSelected((prevState) => {
          prevState[rowData[keyID]] = rowData;
          cb?.(prevState);
          return { ...prevState };
        });
      }
    } else {
      if (e.originalEvent.shiftKey) {
        setCheckBoxSelected((prevState) => {
          const lastIndex = refLastInActiveCheckBoxSelectIndex.current;
          const currentIndex = index;
          if (lastIndex < currentIndex) {
            for (let i = lastIndex; i <= currentIndex; i++) {
              delete prevState[data[i][keyID]];
            }
          } else {
            for (let i = currentIndex; i <= lastIndex; i++) {
              delete prevState[data[i][keyID]];
            }
          }
          cb?.(prevState);
          return { ...prevState };
        });
      } else {
        setCheckBoxSelected((prevState) => {
          refLastInActiveCheckBoxSelectIndex.current = index;
          delete prevState[rowData[keyID]];
          cb?.(prevState);
          return { ...prevState };
        });
      }
    }
  };

  return {
    checkBoxSelected: Object.values(checkBoxSelected),
    checkBoxSelectedOrigin: checkBoxSelected,
    setCheckBoxSelected,
    checkBoxSelect,
  };
};

export default useSelectByCheckbox;
