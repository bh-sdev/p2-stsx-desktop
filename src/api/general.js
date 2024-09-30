import axios from 'axios';

import { ServiceTokenStorage } from 'services';
import { API_CONFIG } from 'configs';

import {
  JWTInsertionInterceptor,
  JWTRefreshInterceptor,
  CommonErrorInterceptor,
} from './interceptors';

export const removeEmptyParams = (params) => {
  for (const key of Object.keys(params)) {
    if (params[key] instanceof Object && params[key] !== null && !Array.isArray(params[key])) {
      params[key] = removeEmptyParams(params[key]);
    }
    if (params[key] === '' || params[key] === null) {
      delete params[key];
    }
  }
  return params;
};

export let controller = new AbortController();

export const cancelingAllRequests = () => {
  controller.abort();
  controller = new AbortController();
};

const BaseAPIConstructor = (TokenStorageService) => {
  const driver = axios.create(API_CONFIG);
  driver.interceptors.request.use(JWTInsertionInterceptor(TokenStorageService));
  driver.interceptors.response.use((response) => response, CommonErrorInterceptor());
  return driver;
};

const AuthorizedAPIConstructor = (TokenStorageService) => {
  const driver = axios.create(API_CONFIG);
  driver.interceptors.request.use(JWTInsertionInterceptor(TokenStorageService));
  driver.interceptors.response.use(
    (response) => response,
    CommonErrorInterceptor(TokenStorageService),
  );
  driver.interceptors.response.use(
    (response) => response,
    JWTRefreshInterceptor(TokenStorageService),
  );
  return driver;
};

const PredefinedAPI = (axiosInstance) => {
  return {
    get: (endpoint, params) =>
      axiosInstance.get(endpoint, { signal: controller.signal, ...params }).then((res) => res.data),
    post: (endpoint, data, params) =>
      axiosInstance
        .post(endpoint, data, { signal: controller.signal, ...params })
        .then((res) => res.data),
    put: (endpoint, data, params) =>
      axiosInstance
        .put(endpoint, data, { signal: controller.signal, ...params })
        .then((res) => res.data),
    delete: (endpoint, params) =>
      axiosInstance
        .delete(endpoint, { signal: controller.signal, ...params })
        .then((res) => res.data),
  };
};

const BaseAPI = PredefinedAPI(BaseAPIConstructor(ServiceTokenStorage));
const AuthorizedAPI = PredefinedAPI(AuthorizedAPIConstructor(ServiceTokenStorage));

export { BaseAPI, AuthorizedAPI };
