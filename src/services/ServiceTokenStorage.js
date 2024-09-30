import { LOCAL_STORAGE_VARIABLES } from 'const';

import ServiceStorage from './ServiceStorage';

const ServiceTokenStorage = {
  setToken: (value) => {
    ServiceStorage.setItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_TOKEN, value);
    ServiceStorage.setItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_SESSION_TOKEN, value);
  },
  getToken: () => {
    return ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_TOKEN);
  },
  getSessionToken: () => {
    return ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_SESSION_TOKEN);
  },
  clearSessionToken: () => {
    return ServiceStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_SESSION_TOKEN);
  },
  setRefreshToken: (value) => {
    ServiceStorage.setItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_REFRESH_TOKEN, value);
  },
  getRefreshToken: () => {
    return ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_REFRESH_TOKEN);
  },
  setAccessToken: (value) => {
    ServiceStorage.setItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_ACCESS_TOKEN, value);
  },
  getAccessToken: () => {
    return ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_ACCESS_TOKEN);
  },
  hasToken: () => {
    return !!ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_TOKEN);
  },
  clear: () => {
    ServiceStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_TOKEN);
    ServiceStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_REFRESH_TOKEN);
    ServiceStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_ACCESS_TOKEN);
  },
};

export default ServiceTokenStorage;
