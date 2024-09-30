import axios from 'axios';
import { getRefreshToken } from './api.auth';
import { EVENT_TYPE_NAMES } from 'const';
import { ServiceEventBus } from 'services';
import ENDPOINTS from 'const/endpoints';

let isRefreshingToken = false;
let failedRequestsQueue = [];

const processFailedRequestsQueue = (error, token) => {
  failedRequestsQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedRequestsQueue = [];
};

const isUnauthorizedError = (error) => {
  return error.response && error.response.data?.Code === 401;
};

const AccessTokenExpiredError = (error) => {
  return (
    error.response &&
    error.response.data?.message.includes('Could not verify signature for Access Token')
  );
};

const isTokenExpiredError = (error, TokenStorageService) => {
  return isUnauthorizedError(error) && TokenStorageService.hasToken();
};

const emitErrorEvent = (error) => {
  ServiceEventBus.$emit(EVENT_TYPE_NAMES.GLOBAL_HANDLE_ERROR, {
    status: error.response?.status,
    msg: error.response?.data?.message || 'Something went wrong. Please, try again later.',
  });
};

const IGNORE_REQUEST_WITH_PATH = [];

const CommonErrorInterceptor = (TokenStorageService) => async (error) => {
  const isTokenExpired = TokenStorageService && isTokenExpiredError(error, TokenStorageService);
  const ignoredRequest = !!IGNORE_REQUEST_WITH_PATH.filter((path) =>
    error.config?.url?.includes(path),
  ).length;

  if (
    !isTokenExpired &&
    !ignoredRequest &&
    ServiceEventBus.has(EVENT_TYPE_NAMES.GLOBAL_HANDLE_ERROR)
  ) {
    emitErrorEvent(error);
  }

  return Promise.reject(error);
};

const JWTRefreshInterceptor = (TokenStorageService) => async (error) => {
  const logOut = () => {
    ServiceEventBus.$emit(EVENT_TYPE_NAMES.LOGOUT);
  };

  const isTokenExist = TokenStorageService.hasToken();
  /**
   * Failed request
   */
  const originalRequest = error.config;
  /**
   * Handle unauthorized response or invalid refresh token
   */
  if (isUnauthorizedError(error) || isTokenExpiredError(error)) {
    logOut();
  }

  /**
   * Handle token expiration response
   */
  if (isTokenExpiredError(error, TokenStorageService) && isTokenExist && !originalRequest._retry) {
    if (isRefreshingToken) {
      try {
        const token = await new Promise(function (resolve, reject) {
          failedRequestsQueue.push({ resolve, reject });
        });
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return axios.request(originalRequest);
      } catch (error) {
        emitErrorEvent(error);
        return Promise.reject(error);
      }
    }

    originalRequest._retry = true;
    isRefreshingToken = true;

    /**
     * Refresh token flow
     */
    try {
      const { idToken, refreshToken, accessToken } = await getRefreshToken(
        TokenStorageService.getRefreshToken(),
      );
      TokenStorageService.setToken(idToken);
      TokenStorageService.setRefreshToken(refreshToken);
      TokenStorageService.setAccessToken(accessToken);
      originalRequest.headers['Authorization'] = `Bearer ${idToken}`;
      processFailedRequestsQueue(null, idToken);
      return axios(originalRequest).catch(async (error) => {
        if (AccessTokenExpiredError(error)) {
          const data = JSON.parse(originalRequest.data);
          data.accessToken = TokenStorageService.getAccessToken();
          originalRequest.data = JSON.stringify(data);
          return axios.request(originalRequest);
        }
        return error;
      });
    } catch (error) {
      emitErrorEvent(error);
      /**
       * Log out
       */
      logOut();
      return Promise.reject(error);
    } finally {
      isRefreshingToken = false;
    }
  }
  /**
   * Return error to the caller in case of any other error type
   */
  return Promise.reject(error);
};

const JWTInsertionInterceptor = (TokenStorageService) => async (config) => {
  const authorizationToken = config.headers['Authorization'];
  config.headers['Accept-Language'] = window.navigator.language || 'en';

  if (!TokenStorageService.hasToken() && config.url === ENDPOINTS.auth.logout) {
    config.headers['Authorization'] = `Bearer ${TokenStorageService.getSessionToken()}`;
  }

  if (!authorizationToken && TokenStorageService.hasToken()) {
    config.headers['Authorization'] = `Bearer ${TokenStorageService.getToken()}`;
  }

  return config;
};

export { JWTInsertionInterceptor, JWTRefreshInterceptor, CommonErrorInterceptor };
