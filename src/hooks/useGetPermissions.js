import { useEffect, useState } from 'react';
import { permissionMainGetId } from '../api/api.permission';

const useGetPermissions = (id) => {
  const [permissions, setPermissions] = useState({ View: null, Other: null });

  const getPermissions = async () => {
    try {
      const response = await permissionMainGetId(id);
      setPermissions(response);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  useEffect(() => {
    if (id) {
      getPermissions();
    }
  }, [id]);

  return {
    View: permissions?.View,
    Delete: permissions.Other?.Delete,
    Edit: permissions.Other?.Edit,
    Create: permissions.Other?.Create,
  };
};

export default useGetPermissions;
