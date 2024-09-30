import { useEffect } from 'react';

const useTabsNavigation = ({ dependency = null, refTabView = null, cb = null, set, length }) => {
  useEffect(() => {
    const listeners = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        if (e.ctrlKey) {
          e.preventDefault();
          set((prevState) => {
            let next = e.code === 'ArrowRight' ? prevState + 1 : prevState - 1;
            if (next < 0) {
              next = length - 1;
            }
            if (next > length - 1) {
              next = 0;
            }
            if (refTabView && refTabView.current.props.children[next].props.disabled) {
              return prevState;
            }
            cb?.(next);
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', listeners);
    return () => {
      window.removeEventListener('keydown', listeners);
    };
  }, [dependency]);
};

export default useTabsNavigation;
