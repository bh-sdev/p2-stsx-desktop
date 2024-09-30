import { LOCAL_STORAGE_VARIABLES } from 'const';

import ServiceStorage from './ServiceStorage';

const ServiceUserStorage = {
  getUserStringInfo() {
    if (!this.getUser()) return '';

    const { AppVersion, Employee, Association, UserName } = this.getUser();
    return `v${AppVersion}, (${UserName} - ${Employee}, ${Association})`;
  },
  setUser: (value) => {
    ServiceStorage.setItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_USER, JSON.stringify(value));
  },
  getUser: () => {
    return JSON.parse(ServiceStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_USER));
  },
  clear: () => {
    ServiceStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_USER);
  },
};

export default ServiceUserStorage;
