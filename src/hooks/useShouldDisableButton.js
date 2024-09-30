import { useSelector } from 'react-redux';
import { useCallback } from 'react';

const useShouldDisableButton = () => {
  const { permissions } = useSelector((state) => state.permissions);

  const shouldDisable = useCallback(
    (id, defaultVal = false) => {
      if (!permissions?.Permissions) {
        return true;
      }
      const permission = permissions?.Permissions?.find((perm) => perm.ID === id);
      return permission ? !permission.View : defaultVal;
    },
    [permissions],
  );

  return { shouldDisable };
};

export default useShouldDisableButton;
