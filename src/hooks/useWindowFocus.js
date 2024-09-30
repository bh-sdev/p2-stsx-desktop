import { useEffect } from 'react';

const useWindowFocus = (callback) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };
    window.addEventListener('focus', callback);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', callback);
    };
  }, []);
};

export default useWindowFocus;
