import { LOCAL_STORAGE_VARIABLES } from 'const';

const usePreferences = () => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_USER))
    .SystemPreferences;
};
export default usePreferences;
